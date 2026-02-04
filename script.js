// --- 1. ตั้งค่าข้อมูล (Data Setup) ---

// ชุดคำถาม (สามารถเพิ่มหรือแก้ไขตรงนี้ได้เลย)
const questions = [
    "ความทรงจำแรกที่คุณประทับใจในตัวอีกฝ่ายคืออะไร?",
    "ถ้าเปรียบความรักของเราเป็นเพลง คิดว่าเป็นเพลงแนวไหน หรือเพลงอะไร?",
    "เรื่องอะไรที่อีกฝ่ายทำแล้วคุณรู้สึกขอบคุณมากที่สุด?",
    "เป้าหมายในปีหน้าที่อยากทำด้วยกันคืออะไร?"
];

// ตัวแปรเก็บสถานะ (State Variables)
let currentPlayer = 1; // 1 = คนแรก, 2 = คนที่สอง
let currentQuestionIndex = 0;
let answers = {
    player1: [],
    player2: []
};

// --- 2. ฟังก์ชันควบคุมหน้าจอ (Screen Control) ---

function showScreen(screenId) {
    // ซ่อนทุกหน้า
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // แสดงหน้าที่ต้องการ
    document.getElementById(screenId).classList.add('active');
}

// --- 3. ฟังก์ชันการทำงานหลัก (Logic) ---

function startQuiz() {
    currentQuestionIndex = 0;
    updateQuestionUI();
    showScreen('quiz-screen');
}

function updateQuestionUI() {
    // อัปเดตข้อความคำถาม
    const questionEl = document.getElementById('question-text');
    questionEl.innerText = questions[currentQuestionIndex];

    // เคลียร์ช่องคำตอบเก่า
    document.getElementById('answer-input').value = "";

    // อัปเดต Progress Bar
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

function nextQuestion() {
    const input = document.getElementById('answer-input');
    const answer = input.value.trim();

    if (answer === "") {
        alert("กรุณาพิมพ์คำตอบก่อนไปต่อ");
        return;
    }

    // บันทึกคำตอบลง Array (คล้าย ArrayList ใน Java)
    if (currentPlayer === 1) {
        answers.player1.push(answer);
    } else {
        answers.player2.push(answer);
    }

    // เช็คว่าหมดคำถามหรือยัง
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        updateQuestionUI();
    } else {
        finishTurn();
    }
}

function finishTurn() {
    if (currentPlayer === 1) {
        // จบเทิร์นคนแรก -> ไปหน้าพัก (Intermission)
        currentPlayer = 2;
        showScreen('intermission-screen');
    } else {
        // จบเทิร์นคนที่สอง -> ไปหน้าสรุปผล (Result)
        showResult();
    }
}

function startPlayerTwo() {
    startQuiz(); // เริ่มคำถามข้อที่ 1 ใหม่ สำหรับคนที่ 2
}

// --- 4. แสดงผลลัพธ์ (Result Rendering) ---

function showResult() {
    const container = document.getElementById('result-container');
    container.innerHTML = ""; // เคลียร์ของเก่า

    // วนลูปสร้าง HTML สำหรับแสดงคำตอบเทียบกัน
    for (let i = 0; i < questions.length; i++) {
        const itemHtml = `
            <div class="result-item">
                <div class="result-question">Q: ${questions[i]}</div>
                <div class="answer-box">
                    <span class="label">P1:</span> ${answers.player1[i]}
                </div>
                <div class="answer-box">
                    <span class="label">P2:</span> ${answers.player2[i]}
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    }

    showScreen('result-screen');
}