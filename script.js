const API_KEY = 'AIzaSyCIM8yMjUELeDjXuA8H06Mb-QJh4Om3pOs';

async function callAI(mode) {
    const model = document.getElementById('modelSelect').value;
    const subject = document.getElementById('subjectSelect').value;
    const input = document.getElementById('userInput').value;
    const image = document.getElementById('imageInput').files[0];
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    let system = `あなたは学習支援AIです。教科:${subject}。`;
    if (mode === 'quiz') system += "3択クイズをJSON形式 [{\"question\":\"\",\"options\":[\"\",\"\",\"\"],\"answer\":\"\",\"explanation\":\"\"}] のみで出力。";
    if (subject === 'programming') system += "HTMLコードを生成する場合は必ず ```html ... ``` で囲んでください。";

    const parts = [{ text: system + "\nユーザー入力: " + input }];
    if (image) {
        const b64 = await new Promise(r => {
            const f = new FileReader(); f.onloadend = () => r(f.result.split(',')[1]); f.readAsDataURL(image);
        });
        parts.push({ inlineData: { data: b64, mimeType: image.type } });
    }

    const resBox = document.getElementById('aiResponse');
    resBox.innerText = "思考中...";
    resBox.classList.remove('hidden');

    try {
        const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ contents: [{ parts }] }) });
        const d = await r.json();
        const text = d.candidates[0].content.parts[0].text;

        if (mode === 'quiz') {
            renderQuiz(text);
        } else {
            resBox.innerHTML = marked.parse(text);
            if (subject === 'programming') {
                const code = text.match(/```html?([\s\S]*?)
```/)?.[1] || text;
                document.getElementById('codeEditor').value = code;
            }
        }
    } catch (e) { resBox.innerText = "エラー発生。"; }
}

function renderQuiz(json) {
    const cont = document.getElementById('quizContainer');
    document.getElementById('quizSection').classList.remove('hidden');
    cont.innerHTML = "";
    try {
        const data = JSON.parse(json.match(/\[.*\]/s)[0]);
        data.forEach(q => {
            const d = document.createElement('div');
            d.innerHTML = `<p>${q.question}</p>`;
            q.options.forEach(o => {
                const b = document.createElement('button');
                b.textContent = o; b.style.display="block";
                b.onclick = () => alert(o === q.answer ? "正解！" : "不正解...");
                d.appendChild(b);
            });
            cont.appendChild(d);
        });
    } catch (e) { cont.innerText = "クイズ解析エラー"; }
}

document.getElementById('runBtn').onclick = () => {
    const f = document.getElementById('previewFrame').contentWindow.document;
    f.open(); f.write(document.getElementById('codeEditor').value); f.close();
};

document.getElementById('sendBtn').onclick = () => callAI('normal');
document.getElementById('quizBtn').onclick = () => callAI('quiz');
