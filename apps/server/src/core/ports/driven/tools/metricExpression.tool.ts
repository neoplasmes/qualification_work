/**
 * supported metric aggregate functions
 */
export type MetricAggregate = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';

/**
 * single primitive aggregate term, e.g. sum(amount) or count(*)
 * null column means count over all rows
 */
export type MetricAggTerm = {
    aggregate: MetricAggregate;
    column: string | null;
};

/**
 * stable key identifying a primitive aggregate term inside a values map
 */
export type MetricTermKey = string;

/**
 * normalized metric expression ast, restricted to binary arithmetic over aggregates
 */
export type MetricExpressionNode =
    | ({ kind: 'agg' } & MetricAggTerm)
    | { kind: 'number'; value: number }
    | {
          kind: 'binary';
          op: '+' | '-' | '*' | '/';
          left: MetricExpressionNode;
          right: MetricExpressionNode;
      };

/**
 * tool that parses metric expressions into a normalized ast and evaluates them
 * over precomputed aggregate values, keeping the math library out of core
 *
 * @export
 * @interface MetricExpressionTool
 */
export interface MetricExpressionTool {
    /**
     * parses an expression into a normalized ast
     *
     * @param expression
     * @returns normalized ast
     * @throws ValidationError on unknown function, unsupported node or malformed input
     */
    parse(expression: string): MetricExpressionNode;

    /**
     * collects distinct primitive aggregate terms referenced by the ast
     *
     * @param ast
     * @returns deduplicated terms
     */
    collectTerms(ast: MetricExpressionNode): MetricAggTerm[];

    /**
     * builds the stable values-map key for a term
     *
     * @param term
     * @returns term key
     */
    termKey(term: MetricAggTerm): MetricTermKey;

    /**
     * folds the ast into a single scalar using precomputed term values
     * null operand or division by zero yields null
     *
     * @param ast
     * @param values
     * @returns scalar value or null
     */
    evaluate(
        ast: MetricExpressionNode,
        values: ReadonlyMap<MetricTermKey, number | null>
    ): number | null;
}
