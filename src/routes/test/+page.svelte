<script>
  import FormQuill from "$lib/components/Form-quill.svelte";
  let form_value = "";
</script>

<FormQuill bind:value={form_value} />

<p>
  {form_value}
</p>
