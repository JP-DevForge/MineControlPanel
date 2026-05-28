document
  .getElementById("start")
  .addEventListener("click", async () => {

    const res = await fetch(
      "/api/server/start",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          server: selectedServer
        })
      }
    );

    const data = await res.json();

    alert(data.message || data.error);
});