import jsep, { type Expression } from 'jsep';

import { ValidationError } from '@qualification-work/microservice-utils';

import type {
    MetricAggregate,
    MetricAggTerm,
    MetricExpressionNode,
    MetricExpressionTool,
    MetricTermKey,
} from '@/core/ports/driven/tools';

const aggregates = new Set<MetricAggregate>([
    'sum',
    'avg',
    'min',
    'max',
    'count',
    'count_distinct',
]);

const binaryOps = new Set(['+', '-', '*', '/']);

// raw shapes of the jsep nodes we accept, narrowed by `type`
type RawNode =
    | { type: 'BinaryExpression'; operator: string; left: Expression; right: Expression }
    | { type: 'UnaryExpression'; operator: string; argument: Expression }
    | { type: 'CallExpression'; callee: Expression; arguments: Expression[] }
    | { type: 'Identifier'; name: string }
    | { type: 'Literal'; value: unknown };

/**
 * metric expression tool backed by jsep
 * jsep only lexes and parses into an ast, evaluation is a pure walk over our normalized ast
 *
 * @export
 * @class JsepMetricExpressionTool
 * @implements {MetricExpressionTool}
 */
export class JsepMetricExpressionTool implements MetricExpressionTool {
    parse(expression: string): MetricExpressionNode {
        // jsep treats * as an operator, normalize count(*) to the no-arg form
        const normalized = expression.replace(/\bcount\s*\(\s*\*\s*\)/gi, 'count()');

        let root: Expression;
        try {
            root = jsep(normalized);
        } catch {
            throw new ValidationError(['expression'], 'Invalid metric expression');
        }

        return this.toAst(root);
    }

    collectTerms(ast: MetricExpressionNode): MetricAggTerm[] {
        const byKey = new Map<MetricTermKey, MetricAggTerm>();
        this.walkTerms(ast, byKey);

        return [...byKey.values()];
    }

    termKey(term: MetricAggTerm): MetricTermKey {
        return `${term.aggregate}:${term.column ?? '*'}`;
    }

    evaluate(
        ast: MetricExpressionNode,
        values: ReadonlyMap<MetricTermKey, number | null>
    ): number | null {
        if (ast.kind === 'number') {
            return ast.value;
        }

        if (ast.kind === 'agg') {
            return values.get(this.termKey(ast)) ?? null;
        }

        const left = this.evaluate(ast.left, values);
        const right = this.evaluate(ast.right, values);
        if (left === null || right === null) {
            return null;
        }

        switch (ast.op) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return right === 0 ? null : left / right;
            default:
                return null;
        }
    }

    private walkTerms(
        ast: MetricExpressionNode,
        byKey: Map<MetricTermKey, MetricAggTerm>
    ): void {
        if (ast.kind === 'agg') {
            byKey.set(this.termKey(ast), {
                aggregate: ast.aggregate,
                column: ast.column,
            });

            return;
        }

        if (ast.kind === 'binary') {
            this.walkTerms(ast.left, byKey);
            this.walkTerms(ast.right, byKey);
        }
    }

    private toAst(node: Expression): MetricExpressionNode {
        const raw = node as unknown as RawNode;

        switch (raw.type) {
            case 'Literal':
                return this.literalToAst(raw.value);
            case 'CallExpression':
                return this.callToAst(raw);
            case 'BinaryExpression':
                return this.binaryToAst(raw);
            case 'UnaryExpression':
                return this.unaryToAst(raw);
            default:
                throw new ValidationError(
                    ['expression'],
                    'Only aggregates, numbers and + - * / are supported'
                );
        }
    }

    private literalToAst(value: unknown): MetricExpressionNode {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new ValidationError(['expression'], 'Invalid number literal');
        }

        return { kind: 'number', value };
    }

    private callToAst(
        raw: Extract<RawNode, { type: 'CallExpression' }>
    ): MetricExpressionNode {
        const callee = raw.callee as unknown as RawNode;
        if (callee.type !== 'Identifier') {
            throw new ValidationError(['expression'], 'Invalid function call');
        }

        const name = callee.name.toLowerCase() as MetricAggregate;
        if (!aggregates.has(name)) {
            throw new ValidationError(
                ['expression'],
                `Unknown function "${callee.name}"`
            );
        }

        // count() / count(*) aggregate over all rows
        if (raw.arguments.length === 0) {
            if (name !== 'count') {
                throw new ValidationError(
                    ['expression'],
                    `"${callee.name}" requires a column`
                );
            }

            return { kind: 'agg', aggregate: 'count', column: null };
        }

        if (raw.arguments.length !== 1) {
            throw new ValidationError(
                ['expression'],
                `"${callee.name}" accepts a single column`
            );
        }

        const arg = raw.arguments[0] as unknown as RawNode;
        if (arg.type !== 'Identifier') {
            throw new ValidationError(
                ['expression'],
                'Aggregate argument must be a column name'
            );
        }

        return { kind: 'agg', aggregate: name, column: arg.name };
    }

    private binaryToAst(
        raw: Extract<RawNode, { type: 'BinaryExpression' }>
    ): MetricExpressionNode {
        if (!binaryOps.has(raw.operator)) {
            throw new ValidationError(
                ['expression'],
                'Only binary + - * / operators are supported'
            );
        }

        return {
            kind: 'binary',
            op: raw.operator as '+' | '-' | '*' | '/',
            left: this.toAst(raw.left),
            right: this.toAst(raw.right),
        };
    }

    private unaryToAst(
        raw: Extract<RawNode, { type: 'UnaryExpression' }>
    ): MetricExpressionNode {
        // unary minus, normalize to (0 - arg) to keep the ast binary-only
        if (raw.operator === '-') {
            return {
                kind: 'binary',
                op: '-',
                left: { kind: 'number', value: 0 },
                right: this.toAst(raw.argument),
            };
        }

        // unary plus is a no-op
        if (raw.operator === '+') {
            return this.toAst(raw.argument);
        }

        throw new ValidationError(['expression'], 'Unsupported unary operator');
    }
}
