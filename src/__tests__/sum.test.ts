import { sum } from '../index';

describe('sum', () => {
    it('should add two numbers correctly', () => {
        expect(sum(2, 3)).toBe(5);
    });
});