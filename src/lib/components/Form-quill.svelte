<script>
    export let value = "";

    import { onMount } from "svelte";
    import {
      ref,
      uploadBytes,
      getDownloadURL,
    } from "firebase/storage";
    import { db, storage } from "$lib/firebase"; // ต้อง export Firebase App และ Storage
    import { dangerToast, successToast , warningToast } from "$lib/customtoast";
  
    let editor;
    let content = "";
    let editorId = `quill-editor-${Math.random().toString(36).substring(2, 15)}`;
  
    // อัปโหลดรูปภาพไป Storage
    async function uploadImage(file) {
      const now = new Date();
      const timestamp = now.getTime();
      const uniqueFileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `temp/${uniqueFileName}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  
  
    function imageHandler() {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();
  
      input.onchange = async () => {
        const file = input.files[0];
        if (file) {
          const maxSize = 2 * 1024 * 1024;
          if (file.size > maxSize) {
            warningToast("ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB");
            return;
          }
          const imageUrl = await uploadImage(file);
          const range = editor.getSelection();
          editor.insertEmbed(range.index, "image", imageUrl);
        }
      };
    }

    async function logContent() {
       
    }

    onMount(() => {
      // โหลด Quill
      if (window.Quill) {
        window.Quill.register("modules/imageResize", window.ImageResize.default);
        editor = new window.Quill(`#${editorId}`, {
          theme: "snow",
          modules: {
            toolbar: {
              container: [
                ["bold", "italic", "underline"],
                [{ header: [1, 2, false] }],
                ["image"],
                [{ align: [] }],
              ],
              handlers: {
                image: imageHandler,
              },
            },
            imageResize: {},
          },
        });
  
        editor.on("text-change", () => {
          content = editor.root.innerHTML;
          value = content;
        });
      }
 
    });

    /*
    function extractImageUrls(html) {
      const regex = /<img[^>]+src="([^">]+)"/g;
      let matches;
      const urls = [];

      while ((matches = regex.exec(html))) {
        urls.push(matches[1]);
      }

      return urls;
    }*/
/*
    function deleteImageFromStorage(imageUrl) {
      const baseUrl = "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT_ID.appspot.com/o/";
      const pathEncoded = imageUrl.split(baseUrl)[1]?.split("?")[0];

      if (!pathEncoded) {
        console.warn("ไม่พบ path ของรูปภาพ: ", imageUrl);
        return;
      }

      const fileRef = ref(storage, decodeURIComponent(pathEncoded));

      return deleteObject(fileRef)
        .then(() => {
          console.log("ลบรูปภาพสำเร็จ: ", imageUrl);
        })
        .catch((error) => {
          console.error("ลบไม่สำเร็จ: ", error);
        });
    }
*/
  </script>
  
  <svelte:head>
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />
    <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/quill-image-resize-module@3.0.0/image-resize.min.js"></script>
    <link rel="stylesheet" href="./style.css">
  </svelte:head>
  
  <style>
    :global(.prose h1) {
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    :global(.prose h2) {
      font-size: 1.25rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    :global(.prose h3) {
      font-size: 1.125rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    :global(.prose h4) {
      font-size: 1rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    :global(.prose h5) {
      font-size: 0.875rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    :global(.prose h6) {
      font-size: 0.75rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    :global(.prose blockquote) {
      border-left: 4px solid #ccc;
      padding-left: 1rem;
      margin: 1rem 0;
      font-style: italic;
    }
    :global(.prose p) {
      margin-bottom: 1rem;
    }
    :global(.prose ul) {
      margin-bottom: 1rem;
    }
    :global(.prose li) {
      margin-bottom: 0.5rem;
    }
    :global(.prose img) {
      max-width: 100%;
      height: auto;
      margin: 1rem 0;
    }
    :global(.ql-align-center) {
      text-align: center;
    }

    :global(.ql-align-right) {
      text-align: right;
    }

    :global(.ql-align-justify) {
      text-align: justify;
    }
    :global(.ql-align-center img) {
      text-align: center;
      display: block; /* ให้รูปเป็น block */
      margin-left: auto;
      margin-right: auto; /* เยื้องรูปภาพให้อยู่กลาง */
    }

    :global(.ql-align-right img) {
      text-align: right;
      display: block;
      margin-left: auto;
    }

    :global(.ql-align-left img) {
      text-align: left;
      display: block;
    }
  </style>
  
  <div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">กรอกแบบฟอร์ม</h1>
    <div id={editorId} class="border rounded-md  min-h-[200px]" ></div>
    
    <button
      on:click={logContent}
      class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
    >
      บันทึกเนื้อหา
    </button>
  </div>
