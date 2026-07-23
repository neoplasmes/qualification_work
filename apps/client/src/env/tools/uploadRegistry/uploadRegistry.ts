import type { UploadHandle } from '@/app/ports/repos/upload';

export class UploadRegistry {
    private readonly files = new Map<string, File>();

    register(files: readonly File[]): UploadHandle[] {
        return files.map(file => {
            const id = crypto.randomUUID();
            this.files.set(id, file);

            return { id, name: file.name, size: file.size, contentType: file.type };
        });
    }
    resolve = (handle: UploadHandle): File => {
        const file = this.files.get(handle.id);
        if (!file) {
            throw new Error('Upload file is no longer available');
        }

        return file;
    };
    release(handles: readonly UploadHandle[]): void {
        for (const handle of handles) {
            this.files.delete(handle.id);
        }
    }
}
