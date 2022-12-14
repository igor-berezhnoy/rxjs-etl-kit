import path from 'path';
import * as fs from "fs";
import * as rx from 'rxjs';
import * as etl from '../../lib';
import { deleteFileIfExists, getTempFolder, getTempPath, loadFileContent } from '../../utils/filesystem';

describe('FilesystemEndpoint', () => {
    test('push method with simple parameters to create file', async () => {
        const OUT_FILE_NAME = 'test_output.tmp';
        const ROOT_FOLDER = getTempFolder();
        const OUT_FILE_FULL_PATH = path.join(ROOT_FOLDER, OUT_FILE_NAME);
        try {
            deleteFileIfExists(OUT_FILE_FULL_PATH);

            const src = new etl.FilesystemEndpoint(ROOT_FOLDER);
            await src.push(OUT_FILE_NAME, 'test', false);

            const res = loadFileContent(OUT_FILE_FULL_PATH);
            expect(res).toEqual('test');
        }
        finally {
            deleteFileIfExists(OUT_FILE_FULL_PATH);
        }
    });

    test('push method with simple parameters to create folder', async () => {
        const OUT_FOLDER_NAME = 'test_output';
        const ROOT_FOLDER = getTempFolder();
        const OUT_FOLDER_FULL_PATH = path.join(ROOT_FOLDER, OUT_FOLDER_NAME);
        try {
            deleteFileIfExists(OUT_FOLDER_FULL_PATH);

            const src = new etl.FilesystemEndpoint(ROOT_FOLDER);
            await src.push(OUT_FOLDER_NAME, '', true);

            const res = fs.existsSync(OUT_FOLDER_FULL_PATH);
            expect(res).toBe(true);
        }
        finally {
            deleteFileIfExists(OUT_FOLDER_FULL_PATH);
        }
    });

    test('clear method', async () => {
        const ROOT_FOLDER = getTempFolder("temp_out_dir");
        const OUT_FILE_NAME = 'test_output.tmp';
        const OUT_FILE_FULL_PATH = path.join(ROOT_FOLDER, OUT_FILE_NAME);
        try {
            deleteFileIfExists(ROOT_FOLDER);

            const src = new etl.FilesystemEndpoint(ROOT_FOLDER);;
            await src.push(OUT_FILE_NAME, 'test', false);

            let res = fs.existsSync(OUT_FILE_FULL_PATH);
            expect(res).toBe(true);

            await src.clear();

            res = fs.existsSync(OUT_FILE_FULL_PATH);
            expect(res).toBe(false);

            await src.clear('*', {includeRootDir: true});

            res = fs.existsSync(ROOT_FOLDER);
            expect(res).toBe(false);
        }
        finally {
            deleteFileIfExists(ROOT_FOLDER);
        }
    });

    test('read method', async () => {
        const ROOT_FOLDER = getTempFolder("temp_out_dir");
        const OUT_FILE_NAME1 = 'test_output1.tmp';
        const OUT_FILE_NAME2 = 'test_output2.tmp';
        try {
            deleteFileIfExists(ROOT_FOLDER);

            const src = new etl.FilesystemEndpoint(ROOT_FOLDER);;
            await src.push(OUT_FILE_NAME1, 'test1', false);
            await src.push(OUT_FILE_NAME2, 'test2', false);

            const res: string[] = [];
            let stream$ = src.read().pipe(
                rx.tap(v => res.push(v.name))
            );
            await etl.run(stream$);

            expect(res).toEqual([ OUT_FILE_NAME1, OUT_FILE_NAME2 ]);
        }
        finally {
            deleteFileIfExists(ROOT_FOLDER);
        }
    });
});