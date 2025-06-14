export function getrolename(role) {
    switch (role) {
      case "user":
        return "นักศึกษา";
      case "teacher":
        return "อาจารย์";
      case "subject_teacher":
        return "อาจารย์ประจำวิชา";
      case "admin":
        return "ผู้ดูแลระบบ";
      default:
        return "ไม่ระบุ";
    }
  }