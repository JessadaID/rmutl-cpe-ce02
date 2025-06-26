<script>
  import { db, auth } from "$lib/firebase";
  import { signInWithEmailAndPassword} from "firebase/auth";
  import { doc, getDoc } from "firebase/firestore";
  import { goto } from "$app/navigation";
  import { setLoginCookies, clearLoginCookies} from "$lib/auth";
  import { dangerToast, warningToast } from "$lib/customtoast";
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="flex justify-center items-center h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
  <div class="flex flex-col lg:flex-row w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl bg-white">
    <!-- Image Section - Hidden on small screens, shown on large screens -->
    <div class="hidden lg:block lg:w-1/2 relative">
      <img
        src="/Sign_in.jpg"
        alt="Login Background"
        class="w-full h-full object-cover"
      />
      <div class="absolute bottom-0 left-0  bg-white/80 from-slate-500 p-4  rounded-tr-xl">
        <p class="text-sm text-gray-500">
          ยังไม่มีบัญชีหรอ ? 
          <a href="/signup" class="text-blue-500 hover:text-blue-600 hover:underline font-bold">
            สมัครสมาชิก
          </a>
        </p>
      </div>
    </div>

    <!-- Form Section -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
      <div class="w-full max-w-md space-y-6">
        <!-- Header -->
        <div class="text-center">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h1>
          <p class="text-sm text-gray-600">เข้าสู่ระบบเพื่อเข้าถึงฟีเจอร์ทั้งหมด</p>
        </div>

        {#if loading}
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p class="text-gray-600">กำลังโหลด...</p>
          </div>
        {:else if !user}
          <form on:submit|preventDefault={login} class="space-y-5">
            <!-- Email Field -->
            <div class="space-y-2">
              <label for="email" class="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                bind:value={email}
                on:blur={validateEmail}
                class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 {emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}"
                placeholder="กรอกอีเมลของคุณ"
                autocomplete="email"
              />
              {#if emailError}
                <p class="text-red-500 text-sm flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  {emailError}
                </p>
              {/if}
            </div>

            <!-- Password Field -->
            <div class="space-y-2">
              <label for="password" class="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                bind:value={password}
                on:blur={validatePassword}
                class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 {passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}"
                placeholder="กรอกรหัสผ่านของคุณ"
                autocomplete="current-password"
              />
              {#if passwordError}
                <p class="text-red-500 text-sm flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  {passwordError}
                </p>
              {/if}
              
              <!-- Forgot Password Link -->
              <div class="flex justify-end">
                <a 
                  href="/forgot-password" 
                  class="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              disabled={loading}
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <!-- Mobile Sign Up Link -->
          <div class="lg:hidden text-center pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600">
              ยังไม่มีบัญชีหรอ ? 
              <a href="/signup" class="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                สมัครสมาชิก
              </a>
            </p>
          </div>
        {:else}
          <!-- Success State -->
          <div class="text-center py-8 space-y-4">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-xl sm:text-2xl font-semibold text-gray-900">เข้าสู่ระบบสำเร็จ!</h2>
            <p class="text-lg text-gray-600">
              เปลี่ยนหน้าใน <span class="font-bold text-blue-600 text-xl">{countdown}</span> วินาที
            </p>
            <p class="text-base text-gray-700">
              ยินดีต้อนรับ <span class="font-semibold text-blue-600">{email}</span>
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Background Shapes - Only visible on larger screens -->
<div class="custom-shape-divider-bottom-1737443007 hidden lg:block">
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
    height: 300px;
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
    height: 80px;
  }

  .custom-shape-divider-bottom-1737647643 .shape-fill {
    fill: #7fa0b3;
  }

  @media (max-width: 1024px) {
    .custom-shape-divider-bottom-1737647643 svg {
      height: 60px;
    }
  }

  @media (max-width: 640px) {
    .custom-shape-divider-bottom-1737647643 svg {
      height: 40px;
    }
  }
</style>