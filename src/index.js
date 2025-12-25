export default {
  async fetch(request, env) {
    const key = new URL(request.url).pathname.slice(1);

    if (key) {
      const value = await env.NOTICEINDEX.get(key);
      if (value) {
        return new Response(value, {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return Response.redirect(
      "https://prod-noticeindex.bluearchiveyostar.com/" + key,
      302
    );
  },
};
