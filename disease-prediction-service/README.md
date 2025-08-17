# Disease Prediction Service

Dịch vụ dự đoán bệnh dựa trên triệu chứng sử dụng Machine Learning (Random Forest).

## 🚀 Tính năng

- **Dự đoán bệnh**: Dựa trên các triệu chứng được chọn
- **Giao diện web đẹp**: Giao diện người dùng thân thiện với tiếng Việt
- **API RESTful**: Có thể tích hợp với các ứng dụng khác
- **Top 5 dự đoán**: Hiển thị 5 bệnh có khả năng cao nhất
- **Độ tin cậy**: Hiển thị mức độ tin cậy của dự đoán

## 📁 Cấu trúc dự án

```
disease-prediction-service/
├── models/                     # Thư mục chứa model đã train
│   ├── random_forest_model.joblib
│   └── label_encoder.joblib
├── data_info/                  # Thông tin mapping
│   ├── symptom_mapping.json   # Mapping triệu chứng EN -> VN
│   └── disease_mapping.json   # Mapping bệnh EN -> VN
├── templates/                  # Giao diện web
│   └── index.html
├── app.py                     # Flask app chính
├── requirements.txt           # Dependencies
└── README.md                 # Hướng dẫn này
```

## 🛠️ Cài đặt

1. **Clone hoặc tải dự án về máy**

2. **Cài đặt dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Chạy ứng dụng:**

   ```bash
   python app.py
   ```

4. **Truy cập web:**
   - Mở trình duyệt và vào: `http://localhost:5000`

## 🔌 API Endpoints

### 1. Dự đoán bệnh

**POST** `/api/predict`

**Request Body:**

```json
{
  "symptoms": ["headache", "fever", "cough"]
}
```

**Response:**

```json
{
  "predicted_disease": "common cold",
  "predicted_disease_vn": "Cảm lạnh thông thường",
  "confidence": 0.85,
  "top_predictions": [
    {
      "disease": "common cold",
      "disease_vn": "Cảm lạnh thông thường",
      "probability": 0.85
    }
  ],
  "input_symptoms": ["headache", "fever", "cough"]
}
```

### 2. Lấy danh sách triệu chứng

**GET** `/api/symptoms`

**Response:**

```json
{
  "symptoms": ["headache", "fever", "cough"],
  "symptoms_vn": ["Đau đầu", "Sốt", "Ho"]
}
```

### 3. Lấy danh sách bệnh

**GET** `/api/diseases`

**Response:**

```json
{
  "diseases": ["common cold", "flu"],
  "diseases_vn": ["Cảm lạnh thông thường", "Cúm"]
}
```

## 💻 Sử dụng giao diện web

1. **Chọn triệu chứng**: Tick vào các checkbox triệu chứng bạn muốn
2. **Xem triệu chứng đã chọn**: Danh sách sẽ hiển thị ở trên
3. **Nhấn "Dự đoán bệnh"**: Hệ thống sẽ xử lý và hiển thị kết quả
4. **Xem kết quả**:
   - Bệnh dự đoán chính với độ tin cậy
   - Top 5 bệnh có khả năng cao nhất

## 🔧 Tùy chỉnh

### Thay đổi port

Sửa file `app.py`:

```python
app.run(debug=True, host='0.0.0.0', port=8080)  # Thay đổi port
```

### Thay đổi model

Thay thế file trong thư mục `models/`:

- `random_forest_model.joblib`: Model chính
- `label_encoder.joblib`: Encoder cho labels

## ⚠️ Lưu ý quan trọng

1. **Model phải tương thích**: Đảm bảo model được train với cùng format dữ liệu
2. **Symptom mapping**: Tên triệu chứng phải khớp với mapping trong `symptom_mapping.json`
3. **Disease mapping**: Tên bệnh phải khớp với mapping trong `disease_mapping.json`

## 🐛 Xử lý lỗi thường gặp

### Lỗi "Failed to load models"

- Kiểm tra đường dẫn đến file model
- Đảm bảo file model tồn tại và không bị hỏng
- Kiểm tra quyền truy cập file

### Lỗi "No symptoms provided"

- Đảm bảo gửi đúng format JSON
- Kiểm tra tên triệu chứng có trong mapping

### Lỗi "Model prediction failed"

- Kiểm tra format dữ liệu đầu vào
- Đảm bảo số lượng features khớp với model

## 📱 Tích hợp với ứng dụng khác

### JavaScript/Node.js

```javascript
const response = await fetch("http://localhost:5000/api/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ symptoms: ["headache", "fever"] }),
});
const result = await response.json();
```

### Python

```python
import requests

response = requests.post('http://localhost:5000/api/predict',
                        json={'symptoms': ['headache', 'fever']})
result = response.json()
```

### cURL

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["headache", "fever"]}'
```

## 🤝 Đóng góp

Nếu bạn muốn cải thiện dự án, hãy:

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

Dự án này được phát hành dưới MIT License.

## 📞 Hỗ trợ

Nếu có vấn đề gì, hãy tạo issue hoặc liên hệ trực tiếp.
