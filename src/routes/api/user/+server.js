
import { json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase";

// วิธี 1: Dynamic Query Builder (แนะนำ)
export async function GET({ url }) {
  try {
    const params = Object.fromEntries(url.searchParams);
    const { page = 1, limit = 10, ...filters } = params;
    
    let q = adminDb.collection('users');
    
    // ถ้ามีหลาย filters ให้เลือกใช้แค่ตัวแรกเพื่อหลีกเลี่ยง composite index
    const filterEntries = Object.entries(filters).filter(([_, value]) => value && value.trim());
    
    if (filterEntries.length > 1) {
      // มีหลาย filters: ใช้ query แค่ตัวเดียว แล้วกรองที่เหลือใน JavaScript
      const [primaryKey, primaryValue] = filterEntries[0];
      
      if (primaryKey === 'email') {
        q = q.where(primaryKey, '>=', primaryValue.toLowerCase())
             .where(primaryKey, '<=', primaryValue.toLowerCase() + '\uf8ff')
             .orderBy('email');
      } else {
        q = q.where(primaryKey, '==', primaryValue)
             .orderBy('__name__');
      }
      
      const querySnapshot = await q.get();
      let users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // JavaScript filtering สำหรับ filters ที่เหลือ
      filterEntries.slice(1).forEach(([key, value]) => {
        users = users.filter(user => {
          if (key === 'email') {
            return user[key] && user[key].toLowerCase().includes(value.toLowerCase());
          } else {
            return user[key] === value;
          }
        });
      });
      
      // JavaScript pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      users = users.slice(startIndex, startIndex + parseInt(limit));
      
      return json(users, { status: 200 });
      
    } else if (filterEntries.length === 1) {
      // มี filter เดียว: ใช้ Firestore query ปกติ
      const [key, value] = filterEntries[0];
      
      if (key === 'email') {
        q = q.where(key, '>=', value.toLowerCase())
             .where(key, '<=', value.toLowerCase() + '\uf8ff')
             .orderBy('email');
      } else {
        q = q.where(key, '==', value)
             .orderBy('__name__');
      }
      
    } else {
      // ไม่มี filter: query ทั้งหมด
      q = q.orderBy('__name__');
    }
    
    // Firestore pagination
    if (page && limit) {
      const startAt = (parseInt(page) - 1) * parseInt(limit);
      q = q.offset(startAt).limit(parseInt(limit));
    }
    
    const querySnapshot = await q.get();
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return json(users, { status: 200 });
    
  } catch (err) {
    console.error("Error in GET /api/user:", err);
    return json({ error: err.message }, { status: 500 });
  }
}