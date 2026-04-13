export const createFileMeta = (data: any) => ({ ...data, id: Math.random().toString(36).substr(2, 9) });
export const logFileEvent = (event: any) => { console.log('File Event Logged:', event); };
