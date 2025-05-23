// src/routes/sitemap.xml/+server.ts
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = () => {
  const pages = [
    '/',
    '/account',
    '/contact',
    '/login',      // เพิ่มหน้า login
    '/signup',   // เพิ่มหน้า register
    '/cpe02',   // เพิ่มหน้า projects (ถ้ามีหน้าแสดงรายการ project)
    // หากมีหน้า static อื่นๆ สามารถเพิ่มได้ที่นี่
  ]; // ใส่หน้าหลักของคุณที่มีจริง

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `<url>
  <loc>https://svkit-project.vercel.app${page}</loc>
</url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
