const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const SUPABASE_URL = "https://nqvdkscjacnlaargqspb.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-firework`;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let particles = [];

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 2 + 1;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 6;
    this.friction = 0.96;
    this.gravity = 0.05;
    this.alpha = 1;
  }

  update() {
    this.speed *= this.friction;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed + this.gravity;
    this.alpha -= 0.01;
  }

  draw() {
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function explode(x, y, colors, count = 120) {
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(x, y, color));
  }
}

async function generateFirework() {
  const promptEl = document.getElementById("prompt");
  const status = document.getElementById("status");

  const prompt = (promptEl?.value || "").trim();

  if (!prompt) {
    if (status) status.innerText = "Type something first ✏️";
    return;
  }

  if (status) status.innerText = "Calling AI... 🎆";

  try {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Bad JSON from server: " + text);
    }

    console.log("AI response:", data);

    if (!res.ok) {
      throw new Error(data?.error || "Request failed");
    }

    const colors = data?.colors || ["#ffffff"];
    const count = data?.particles || 120;

    if (status) status.innerText = data?.name || "Boom! ✨";

    setTimeout(() => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.6;
      explode(x, y, colors, count);
    }, 300);

  } catch (err) {
    console.error("Firework error:", err);
    if (status) status.innerText = "AI failed 😢 (check console)";
  }
}

function animate() {
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();

    if (particles[i].alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}

animate();