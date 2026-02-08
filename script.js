// Import Firebase SDK (เรียกใช้ผ่าน CDN ไม่ต้องลงโปรแกรมเพิ่ม)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. การตั้งค่า Firebase (วาง Config ของคุณตรงนี้) ---
const firebaseConfig = {
    apiKey: "AIzaSyBHQN7BD8ZdfpsQ0yc9N4J-J2XckATc188",
    authDomain: "relationship-app-8f983.firebaseapp.com",
    databaseURL: "https://relationship-app-8f983-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "relationship-app-8f983",
    storageBucket: "relationship-app-8f983.firebasestorage.app",
    messagingSenderId: "246785549716",
    appId: "1:246785549716:web:c4c251152794be5a985b81"
};

// เริ่มต้นระบบ
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 2. ตัวแปรเกม ---
const questions = [
    "ความทรงจำแรกที่คุณประทับใจในตัวอีกฝ่ายคืออะไร?",
    "ถ้าเปรียบความรักของเราเป็นเพลง คิดว่าเป็นเพลงแนวไหน?",
    "เรื่องอะไรที่อีกฝ่ายทำแล้วคุณรู้สึกขอบคุณมากที่สุด?",
    "เป้าหมายในปีหน้าที่อยากทำด้วยกันคืออะไร?",
    "ถ้าวันหนึ่งหน้าตาและรูปร่างของฉันเปลี่ยนไปจนดูแย่ลง (เช่น อ้วนขึ้นมาก หรือประสบอุบัติเหตุ) ความรู้สึกรักของคุณจะลดน้อยลงไหม?",
    "นิสัยเสียที่สุดของฉันที่คุณ 'เกลียด' แต่ยังยอมทนอยู่ทุกวันนี้คืออะไร?",
    "ถ้ามีคนที่ดีกว่าฉันทุกอย่าง (หน้าตาดีกว่า รวยกว่า นิสัยดีกว่า) เข้ามาจีบคุณ ในวันที่เรากำลังทะเลาะกันหนักๆ คุณจะหวั่นไหวไหม?",
    "ระหว่าง 'ความฝันสูงสุดของคุณ' กับ 'ความสัมพันธ์ของเรา' ถ้าต้องเลือกทิ้งอย่างใดอย่างหนึ่ง คุณจะเลือกอะไร?",
    "ถ้าวันหนึ่งฉันล้มละลาย มีหนี้สิน หรือตกต่ำที่สุดในชีวิต คุณพร้อมจะลำบากกัดก้อนเกลือกินไปพร้อมกับฉันไหม?",
    "เรื่องโกหกหรือความลับอะไรที่คุณซ่อนไว้ แล้วยังไม่กล้าบอกฉันจนถึงตอนนี้?",
    "ภาพสุดท้ายที่คุณมองเห็นในความสัมพันธ์นี้ คือ 'งานแต่งงาน' หรือเป็นแค่ 'ความทรงจำดีๆ ในช่วงวัยรุ่น'?",
    "ถ้าครอบครัวของคุณไม่ชอบฉัน และบังคับให้เลิกกัน คุณจะสู้เพื่อเรา หรือจะยอมทำตามครอบครัว?",
    "สิ่งที่คุณคาดหวังจากตัวฉันมากที่สุด แต่ฉันยังทำให้คุณไม่ได้สักที คือเรื่องอะไร?",
    "ถ้าพรุ่งนี้เป็นวันสุดท้ายที่เราจะได้อยู่ด้วยกัน สิ่งที่คุณเสียใจที่สุดที่ยังไม่ได้ทำให้ฉัน คืออะไร?"
];

let myRole = null; // 'host' (คนสร้าง) หรือ 'guest' (คนแจม)
let roomId = null;
let currentQIndex = 0;

// ทำให้ฟังก์ชันเรียกใช้ได้จาก HTML (เพราะใช้ type="module" สโคปจะแคบลง)
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.submitAnswer = submitAnswer;

// --- 3. ฟังก์ชันจัดการห้อง (Lobby) ---

function generateRoomId() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // สุ่มเลข 6 หลัก
}

function createRoom() {
    roomId = generateRoomId();
    myRole = 'host';

    // สร้างห้องใน Database
    set(ref(db, 'rooms/' + roomId), {
        status: 'waiting', // สถานะ: รอคนเข้า
        host_ready: true,
        guest_ready: false,
        answers_host: ["", "", "", ""], // จองที่ไว้
        answers_guest: ["", "", "", ""]
    });

    document.getElementById('display-room-code').innerText = roomId;
    showScreen('waiting-screen');

    // เริ่มดักฟังการเปลี่ยนแปลง (ถ้ามีคนเข้า สถานะจะเปลี่ยน)
    listenToRoom();
}

function joinRoom() {
    roomId = document.getElementById('room-code-input').value.trim();
    if (roomId.length !== 6) { alert("รหัสห้องต้องมี 6 หลัก"); return; }

    myRole = 'guest';

    // อัปเดตสถานะว่า Guest เข้ามาแล้ว
    update(ref(db, 'rooms/' + roomId), {
        guest_ready: true,
        status: 'playing' // เปลี่ยนสถานะเป็นเริ่มเล่น
    });

    listenToRoom();
}

// --- 4. ฟังก์ชันฟัง Database (Listener) ---
// นี่คือส่วนที่ทำให้ Real-time: ทันทีที่ DB เปลี่ยน โค้ดนี้จะทำงาน
function listenToRoom() {
    onValue(ref(db, 'rooms/' + roomId), (snapshot) => {
        const data = snapshot.val();
        
        if (!data) { alert("ไม่พบห้องนี้! ตรวจสอบรหัสอีกครั้ง"); location.reload(); return; }

        // [แก้ตรงนี้] : ถ้าสถานะเป็น playing และเรายังไม่อยู่ในหน้าเกม -> ให้เริ่มเกมเลย
        if (data.status === 'playing') {
            if (!document.getElementById('quiz-screen').classList.contains('active')) {
                startGameUI();
            }
        }

        // 2. เช็คว่าจบเกมหรือยัง (ทั้งคู่ตอบครบ)
        checkGameStatus(data);
    });
}

// --- 5. ฟังก์ชันการเล่น (Gameplay) ---

function startGameUI() {
    showScreen('quiz-screen');
    renderQuestion();
}

function renderQuestion() {
    document.getElementById('question-text').innerText = questions[currentQIndex];
    document.getElementById('answer-input').value = "";
    document.getElementById('progress-fill').style.width = `${(currentQIndex / questions.length) * 100}%`;
    document.getElementById('waiting-partner').style.display = 'none';

    // ปลดล็อกปุ่ม
    document.querySelector('#quiz-screen button').disabled = false;
}

function submitAnswer() {
    const ans = document.getElementById('answer-input').value.trim();
    if (ans === "") return;

    // ล็อกปุ่มกันกดซ้ำ
    document.querySelector('#quiz-screen button').disabled = true;
    document.getElementById('waiting-partner').style.display = 'block';

    // ส่งคำตอบขึ้น Database ตามตำแหน่งคำถาม (Array Index)
    const updates = {};
    if (myRole === 'host') {
        updates[`rooms/${roomId}/answers_host/${currentQIndex}`] = ans;
    } else {
        updates[`rooms/${roomId}/answers_guest/${currentQIndex}`] = ans;
    }
    update(ref(db), updates);
}

function checkGameStatus(data) {
    // ดึงคำตอบล่าสุดมาเช็ค
    const hostAns = data.answers_host || [];
    const guestAns = data.answers_guest || [];

    // เช็คว่าข้อปัจจุบัน ทั้งคู่ตอบหรือยัง?
    if (hostAns[currentQIndex] && guestAns[currentQIndex]) {
        // ถ้าตอบครบทั้งคู่แล้ว -> ไปข้อถัดไป
        currentQIndex++;

        if (currentQIndex < questions.length) {
            setTimeout(renderQuestion, 500); // หน่วงนิดนึงให้รู้สึกนุ่มนวล
        } else {
            showResult(hostAns, guestAns);
        }
    }
}

// --- 6. แสดงผล (Result) ---
function showResult(hostAns, guestAns) {
    const container = document.getElementById('result-container');
    container.innerHTML = "";

    for (let i = 0; i < questions.length; i++) {
        container.innerHTML += `
            <div class="result-item">
                <div class="result-question">Q: ${questions[i]}</div>
                <div class="answer-box"><span class="label">Host:</span> ${hostAns[i]}</div>
                <div class="answer-box"><span class="label">Guest:</span> ${guestAns[i]}</div>
            </div>
        `;
    }
    showScreen('result-screen');
}

// Helper: สลับหน้าจอ
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
