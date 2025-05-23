<script>
  import { db, auth } from "$lib/firebase";
  import { signInWithEmailAndPassword} from "firebase/auth";
  import { doc, getDoc } from "firebase/firestore";
  import { goto } from "$app/navigation";
  import { setLoginCookies, clearLoginCookies} from "$lib/auth";
  import { dangerToast } from "$lib/customtoast";
  import { onMount } from "svelte";

  let email = "";
  let password = "";
  let user = null;
  let role = null;
  let name = null;
  let loading = false;
  let countdown = 3; // Initial countdown value in seconds
  let countdownInterval; // Variable to hold the interval ID
  // เพิ่มตัวแปรสำหรับ validation
  let emailError = "";
  let passwordError = "";

  // ฟังก์ชันตรวจสอบ email
  function validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      emailError = "กรุณากรอกอีเมล";
      return false;
    } else if (!emailRegex.test(email)) {
      emailError = "กรุณากรอกอีเมลให้ถูกต้อง";
      return false;
    }
    emailError = "";
    return true;
  }

  // ฟังก์ชันตรวจสอบ password
  function validatePassword() {
    if (!password) {
      passwordError = "กรุณากรอกรหัสผ่าน";
      return false;
    } else if (password.length < 6) {
      passwordError = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      return false;
    }
    passwordError = "";
    return true;
  }

  async function login() {
    // ตรวจสอบความถูกต้องของข้อมูลก่อนส่ง
    if (!validateEmail() || !validatePassword()) {
      return;
    }
    
    try {
      loading = true;
      setLoginCookies(email,"user"); // Set initial cookies with user role as "user"
      

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      user = userCredential.user; // Update user state

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        role = userData.role; // Update role state
        name = userData.name; // Update name state
        setLoginCookies(email, role, name);

        // Start the countdown
        countdownInterval = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(countdownInterval); // Clear the interval when countdown reaches 0
            redirectToDashboard();
          }
        }, 1000);
      }
    } catch (error) {
      clearLoginCookies();
      // ปรับปรุงข้อความแสดงข้อผิดพลาดให้เฉพาะเจาะจงมากขึ้น
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'ไม่พบบัญชีผู้ใช้นี้';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'รหัสผ่านไม่ถูกต้อง';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'มีการพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง';
      } else {
        errorMessage += ' ' + error.message;
      }
      
      dangerToast(errorMessage);
    } finally {
      loading = false;
    }
  }

  function redirectToDashboard() {
    if (role == "admin") {
      goto("/Dashboard");
    } else if (role == "subject_teacher" || role == "teacher") {
      goto("/TS_Dashboard");
    } else {
      goto("/cpe02");
    }
  }

  onMount(() => {
    return () => {
      // Cleanup function to clear the interval when the component is unmounted
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  });
</script>

<svelte:head>
  <title>เข้าสู่ระบบ</title>
  <meta name="description" content="เข้าสู่ระบบเพื่อเข้าถึงฟีเจอร์ทั้งหมด" />
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="flex justify-center items-center min-h-screen">
  <div class="flex w-full max-w-4xl rounded-lg overflow-hidden relative" style="box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);">
    <div class="hidden md:block w-1/2 relative" >
      <img
        src="/Sign_in.jpg"
        alt="Login Background"
        class="w-full h-full object-cover"
      />
      <div
        class="absolute bottom-0 left-0 bg-white/80 p-4"
      >

        <p class="text-sm text-gray-500">
          ยังไม่มีบัญชีหรอ ? <a
            href="/signup"
            class="text-blue-500 hover:underline font-bold">สมัครสมาชิก</a
          >
        </p>
      </div>
    </div>
    <div
      class="w-full md:w-1/2 flex items-center justify-center p-6 bg-white/60 backdrop-blur-md"
    >
      <div class="w-full max-w-md">
        <h1 class="text-xl font-bold mb-5 text-center">เข้าสู่ระบบ</h1>
        {#if loading}
          <p class="text-center text-gray-500">กำลังโหลด...</p>
        {:else if !user}
          <form on:submit|preventDefault={login} class="space-y-4">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 mb-1">อีเมล</label
              >
              <input
                id="email"
                type="email"
                bind:value={email}
                on:blur={validateEmail}
                required
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300 {emailError ? 'border-red-500' : ''}"
              />
              {#if emailError}
                <p class="text-red-500 text-xs mt-1">{emailError}</p>
              {/if}
            </div>
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label
              >
              <input
                id="password"
                type="password"
                bind:value={password}
                on:blur={validatePassword}
                required
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300 {passwordError ? 'border-red-500' : ''}"
              />
              {#if passwordError}
                <p class="text-red-500 text-xs mt-1">{passwordError}</p>
              {/if}
              <!-- เพิ่มลิงก์ลืมรหัสผ่าน -->
              <div class="flex justify-end mt-1">
                <a href="/forgot-password" class="text-sm text-blue-500 hover:underline">ลืมรหัสผ่าน?</a>
              </div>
            </div>
            <button
              type="submit"
              class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        {:else}
        <center>
          <p class="text-xl">Redirect in <b>{countdown}</b></p>
          <p class="text-l pt-2">ยินดีต้อนรับ <b>{email}</b></p>
        </center>
        {/if}
      </div>
    </div>
  </div>
 </div>

<div class="custom-shape-divider-bottom-1737443007 hidden md:block">
  <svg
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
  >
    <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" class="shape-fill"></path>
  </svg>
</div>

<div class="custom-shape-divider-bottom-1737647643">
  <svg
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
  >
    <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" class="shape-fill"></path>
  </svg>
</div>

<style>
  .custom-shape-divider-bottom-1737443007 {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    overflow: hidden;
    line-height: 0;
    transform: rotate(180deg);
    z-index: -1;
  }

  .custom-shape-divider-bottom-1737443007 svg {
    position: relative;
    display: block;
    width: calc(300% + 1.3px);
    height: 369px;
    transform: rotateY(180deg);
  }

  .custom-shape-divider-bottom-1737443007 .shape-fill {
    fill: #a1cae2;
  }
  .custom-shape-divider-bottom-1737647643 {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    overflow: hidden;
    line-height: 0;
    transform: rotate(180deg);
    z-index: -1;
  }

  .custom-shape-divider-bottom-1737647643 svg {
    position: relative;
    display: block;
    width: calc(100% + 1.3px);
    height: 112px;
  }

  .custom-shape-divider-bottom-1737647643 .shape-fill {
    fill: #7fa0b3;
  }
</style>