import * as rx from 'rxjs';
import * as etl from '../../lib';

describe('Operator join()', () => {
    test('join arrays', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<number[]>([[1], [2]]);
        const src2 = new etl.BufferEndpoint<number[]>([[10], [11]]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        console.log(res)

        expect(res).toEqual([[1, 10], [1, 11], [2, 10], [2, 11]]);
    });

    test('join objects', async () => {
        let res: {}[] = [];

        const src1 = new etl.BufferEndpoint<{f1: number}>([{f1: 1}, {f1: 2}]);
        const src2 = new etl.BufferEndpoint<{f2: number}>([{f2: 10}, {f2: 11}]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([{f1: 1, f2: 10}, {f1: 1, f2: 11}, {f1: 2, f2: 10}, {f1: 2, f2: 11}]);
    });

    test('join scalars', async () => {
        let res: number[] = [];

        const src1 = new etl.BufferEndpoint<number>([1, 2]);
        const src2 = new etl.BufferEndpoint<number>([10, 11]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([[1, 10], [1, 11], [2, 10], [2, 11]]);
    });


    test('join array and object', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<number[]>([[1], [2]]);
        const src2 = new etl.BufferEndpoint<{f1: number}>([{f1: 1}, {f1: 2}]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([[1, 1], [1, 2], [2, 1], [2, 2]]);
    });

    test('join object and array', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<{f1: number}>([{f1: 1}, {f1: 2}]);
        const src2 = new etl.BufferEndpoint<number[]>([[1], [2]]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([[1, 1], [1, 2], [2, 1], [2, 2]]);
    });


    test('join array and scalar', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<number[]>([[1], [2]]);
        const src2 = new etl.BufferEndpoint<number>([10, 20]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([[1, 10], [1, 20], [2, 10], [2, 20]]);
    });

    test('join scalar and array', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<number>([10, 20]);
        const src2 = new etl.BufferEndpoint<number[]>([[1], [2]]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([[10, 1], [10, 2], [20, 1], [20, 2]]);
    });


    test('join object and scalar with field name specified', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<{f1: number}>([{f1: 1}, {f1: 2}]);
        const src2 = new etl.BufferEndpoint<number>([10, 20]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read(), 'f2'),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([{f1: 1, f2: 10}, {f1: 1, f2: 20}, {f1: 2, f2: 10}, {f1: 2, f2: 20}]);
    });

    test('join object and scalar without field name parameter', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<{f1: number}>([{f1: 1}, {f1: 2}]);
        const src2 = new etl.BufferEndpoint<number>([10, 20]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([[1, 10], [1, 20], [2, 10], [2, 20]]);
    });


    test('join scalar and object with field name specified', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<number>([1, 2]);
        const src2 = new etl.BufferEndpoint<{f2: number}>([{f2: 10}, {f2: 20}]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read(), 'f1'),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([{f1: 1, f2: 10}, {f1: 1, f2: 20}, {f1: 2, f2: 10}, {f1: 2, f2: 20}]);
    });

    test('join scalar and object without field name parameter', async () => {
        let res: number[][] = [];
        const src1 = new etl.BufferEndpoint<number>([1, 2]);
        const src2 = new etl.BufferEndpoint<{f1: number}>([{f1: 10}, {f1: 20}]);

        let stream$ = src1.read().pipe(
            etl.join(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([[1, 10], [1, 20], [2, 10], [2, 20]]);
    });


    test('joinArrays operator', async () => {
        let res: number[][] = [];

        const src1 = new etl.BufferEndpoint<number[]>([[1], [2]]);
        const src2 = new etl.BufferEndpoint<number[]>([[10], [11]]);

        let stream$ = src1.read().pipe(
            etl.joinArrays(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([[1, 10], [1, 11], [2, 10], [2, 11]]);
    });

    test('joinObjects operator', async () => {
        let res: {}[] = [];

        const src1 = new etl.BufferEndpoint<{f1: number}>([{f1: 1}, {f1: 2}]);
        const src2 = new etl.BufferEndpoint<{f2: number}>([{f2: 10}, {f2: 11}]);

        let stream$ = src1.read().pipe(
            etl.joinObjects(src2.read()),
            rx.tap(v => res.push(v))
        );

        await etl.run(stream$);

        expect(res).toEqual([{f1: 1, f2: 10}, {f1: 1, f2: 11}, {f1: 2, f2: 10}, {f1: 2, f2: 11}]);
    });
});