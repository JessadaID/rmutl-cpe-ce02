// src/lib/progress.ts
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false }); // ปิดวงกลมหมุน

export const startProgress = () => NProgress.start();
export const doneProgress = () => NProgress.done();
