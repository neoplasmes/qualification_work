import { describe, expect, it } from 'vitest';

import { WorkspaceGridPanelModel } from './workspaceGridPanelModel';

const makeEl = () => document.createElement('div');

// jsdom setup mocks offsetWidth/offsetHeight to 640/320 on the prototype
describe('WorkspaceGridPanelModel', () => {
    it('parses px sizes and exposes them', () => {
        const model = new WorkspaceGridPanelModel('row', '320px', '100px', '800px');

        expect(model.getInitialSizePx()).toBe(320);
        expect(model.getMinSizePx()).toBe(100);
        expect(model.getMaxSizePx()).toBe(800);
    });

    it('throws on non-px size format', () => {
        expect(
            () => new WorkspaceGridPanelModel('row', '320' as never, '0px', '800px')
        ).toThrow();
        expect(
            () => new WorkspaceGridPanelModel('row', '320em' as never, '0px', '800px')
        ).toThrow();
    });

    it('throws when min is greater than max', () => {
        expect(
            () => new WorkspaceGridPanelModel('row', '320px', '900px', '800px')
        ).toThrow();
    });

    it('saved size overrides initial', () => {
        const model = new WorkspaceGridPanelModel(
            'row',
            '320px',
            '100px',
            '800px',
            'p',
            500
        );

        expect(model.getInitialSizePx()).toBe(500);
    });

    it('attach applies axis constraints and initial size (row)', () => {
        const el = makeEl();
        new WorkspaceGridPanelModel('row', '320px', '100px', '800px').attach(el);

        expect(el.style.minWidth).toBe('0px');
        expect(el.style.maxWidth).toBe('800px');
        expect(el.style.width).toBe('320px');
        expect(el.style.flexBasis).toBe('320px');
    });

    it('attach applies axis constraints and initial size (column)', () => {
        const el = makeEl();
        new WorkspaceGridPanelModel('column', '320px', '100px', '800px').attach(el);

        expect(el.style.minHeight).toBe('0px');
        expect(el.style.maxHeight).toBe('800px');
        expect(el.style.height).toBe('320px');
    });

    it('setSizePx clamps to [min, max]', () => {
        const model = new WorkspaceGridPanelModel('row', '320px', '100px', '800px');
        model.attach(makeEl());

        expect(model.setSizePx(50)).toBe(100);
        expect(model.setSizePx(900)).toBe(800);
        expect(model.setSizePx(400)).toBe(400);
    });

    it('setFittedSizePx clamps to [0, max] and allows below min', () => {
        const model = new WorkspaceGridPanelModel('row', '320px', '100px', '800px');
        model.attach(makeEl());

        expect(model.setFittedSizePx(50)).toBe(50);
        expect(model.setFittedSizePx(-10)).toBe(0);
        expect(model.setFittedSizePx(900)).toBe(800);
    });

    it('getCurrentSizePx throws without an element', () => {
        const model = new WorkspaceGridPanelModel('row', '320px', '100px', '800px');

        expect(() => model.getCurrentSizePx()).toThrow();
    });

    it('getCurrentSizePx returns the measured size', () => {
        const model = new WorkspaceGridPanelModel('row', '320px', '100px', '800px');
        model.attach(makeEl());

        expect(model.getCurrentSizePx()).toBe(640);
    });

    it('getCurrentSizePx falls back to last applied size when hidden', () => {
        const el = makeEl();
        Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 0 });

        const model = new WorkspaceGridPanelModel('row', '320px', '100px', '800px');
        model.attach(el);

        expect(model.getCurrentSizePx()).toBe(320);

        model.setSizePx(500);
        expect(model.getCurrentSizePx()).toBe(500);
    });
});
