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

  async scheduled(controller, env, ctx) {
    try {
      const upstream = await fetch(
        "https://prod-noticeindex.bluearchiveyostar.com/prod/index.json"
      );
      if (!upstream.ok) {
        console.log("从上游拉取错误", upstream.status);
        return;
      }

      let index;
      try {
        index = await upstream.json();
      } catch (e) {
        console.log("解析为 JSON 错误", e);
        return;
      }

      const stack = [index];
      while (stack.length) {
        const obj = stack.pop();
        if (obj && typeof obj === "object") {
          for (const key in obj) {
            const value = obj[key];
            if (key === "Url" && typeof value === "string" && value.endsWith(".html")) {
              obj[key] = value.replace(
                "prod-notice.bluearchiveyostar.com",
                "prod-notice.bluearchive.cafe"
              );
            } else if (value && typeof value === "object") {
              stack.push(value);
            }
          }
        }
      }

      const value = JSON.stringify(index, null, 2);

      await env.NOTICEINDEX.put("prod/index.json", value);

      const time = new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        year: "numeric", month: "2-digit", day: "2-digit"
      }).format(new Date());

      console.log(`公告信息更新成功：${time}`);
    } catch (err) {
      console.error("公告信息更新失败：", err);
    }
  },
};
