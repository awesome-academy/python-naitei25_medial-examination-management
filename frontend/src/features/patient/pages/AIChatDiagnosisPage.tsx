import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  diseaseService,
  type DiagnosisResponse,
} from "../../../shared/services/diseaseService";
import { SYMPTOM_RELATIONSHIPS, COMMON_SYMPTOMS } from "../../../shared/constants/symptomRelationships";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  symptoms?: string[];
  suggestions?: Array<{ key: string; name_vn: string }>;
  diagnosis?: DiagnosisResponse;
}

interface SelectedSymptom {
  key: string;
  name_vn: string;
}

const AIChatDiagnosisPage: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>(
    []
  );
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomsVn, setSymptomsVn] = useState<string[]>([]);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      setIsLoading(true);

      // Check service health
      const available = await diseaseService.checkHealth();
      setServiceAvailable(available);

      if (!available) {
        addMessage(
          "ai",
          "Xin lỗi, dịch vụ AI hiện tại không khả dụng. Vui lòng thử lại sau.",
          {}
        );
        return;
      }

      // Load symptoms
      const data = await diseaseService.getSymptoms();
      setSymptoms(data.symptoms);
      setSymptomsVn(data.symptoms_vn);

      // Add welcome message
      const commonSymptoms = data.symptoms
        .slice(0, 5)
        .map((symptom, index) => ({
          key: symptom,
          name_vn: data.symptoms_vn[index] || symptom,
        }));

      addMessage(
        "ai",
        "Xin chào! Tôi là trợ lý AI chẩn đoán bệnh. Hãy mô tả các triệu chứng bạn đang gặp phải nhé.",
        {
          suggestions: commonSymptoms,
        }
      );

      setIsInitialized(true);
    } catch (error: any) {
      addMessage(
        "ai",
        "Có lỗi xảy ra khi khởi tạo dịch vụ. Vui lòng thử lại.",
        {}
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (
    type: "user" | "ai",
    content: string,
    extras: {
      symptoms?: string[];
      suggestions?: Array<{ key: string; name_vn: string }>;
      diagnosis?: DiagnosisResponse;
    }
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      ...extras,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSymptomSelect = (symptom: { key: string; name_vn: string }) => {
    const isAlreadySelected = selectedSymptoms.some(
      (s) => s.key === symptom.key
    );

    if (isAlreadySelected) {
      setSelectedSymptoms((prev) => prev.filter((s) => s.key !== symptom.key));
      addMessage("user", `Đã bỏ chọn: ${symptom.name_vn}`, {});
    } else {
      setSelectedSymptoms((prev) => [...prev, symptom]);
      addMessage("user", `Đã chọn triệu chứng: ${symptom.name_vn}`, {});
    }

    // Provide AI response with suggestions
    setTimeout(() => {
      if (!isAlreadySelected) {
        const relatedSymptoms = getRelatedSymptoms(symptom.key);
        const responseMessages = [
          `Tôi đã ghi nhận triệu chứng "${symptom.name_vn}". Dựa trên triệu chứng này, bạn có thể cũng gặp các triệu chứng liên quan sau:`,
          `Cảm ơn bạn đã chọn "${symptom.name_vn}". Những người có triệu chứng này thường cũng gặp:`,
          `"${symptom.name_vn}" đã được ghi nhận. Các triệu chứng thường đi kèm với triệu chứng này là:`,
          `Tôi hiểu bạn có triệu chứng "${symptom.name_vn}". Hãy kiểm tra xem bạn có gặp thêm các triệu chứng liên quan này không:`,
        ];
        
        const randomMessage = responseMessages[Math.floor(Math.random() * responseMessages.length)];
        
        addMessage(
          "ai",
          relatedSymptoms.length > 0 
            ? randomMessage
            : `Tôi đã ghi nhận triệu chứng "${symptom.name_vn}". Bạn có gặp thêm triệu chứng nào khác không?`,
          {
            suggestions: relatedSymptoms,
          }
        );
      } else {
        addMessage(
          "ai",
          `Đã bỏ triệu chứng "${symptom.name_vn}". Bạn có muốn thêm triệu chứng khác không?`,
          {}
        );
      }
    }, 500);
  };

  const getRelatedSymptoms = (
    selectedKey: string
  ): Array<{ key: string; name_vn: string }> => {
    const related = SYMPTOM_RELATIONSHIPS[selectedKey] || [];
    
    // Get symptoms that exist in our symptom list
    const availableRelated = related
      .map((key) => {
        const index = symptoms.indexOf(key);
        if (index >= 0) {
          return {
            key,
            name_vn: symptomsVn[index],
          };
        }
        return null;
      })
      .filter((s) => s !== null)
      .filter(
        (s) => !selectedSymptoms.some((selected) => selected.key === s!.key)
      ) as Array<{ key: string; name_vn: string }>;

    // If we have related symptoms, return them
    if (availableRelated.length > 0) {
      return availableRelated.slice(0, 4);
    }

    // Fallback: suggest random symptoms from the same category or common symptoms
    const fallbackSuggestions = COMMON_SYMPTOMS
      .filter((key) => key !== selectedKey)
      .map((key) => {
        const index = symptoms.indexOf(key);
        if (index >= 0) {
          return {
            key,
            name_vn: symptomsVn[index],
          };
        }
        return null;
      })
      .filter((s) => s !== null)
      .filter(
        (s) => !selectedSymptoms.some((selected) => selected.key === s!.key)
      ) as Array<{ key: string; name_vn: string }>;

    return fallbackSuggestions.slice(0, 3);
  };

  const getCombinedSuggestions = (): Array<{ key: string; name_vn: string }> => {
    if (selectedSymptoms.length === 0) return [];

    // Get suggestions from all selected symptoms
    const allSuggestions: { [key: string]: number } = {};
    
    selectedSymptoms.forEach((symptom) => {
      const related = getRelatedSymptoms(symptom.key);
      related.forEach((suggestion) => {
        allSuggestions[suggestion.key] = (allSuggestions[suggestion.key] || 0) + 1;
      });
    });

    // Sort by frequency (symptoms that appear in multiple related lists get higher priority)
    const sortedSuggestions = Object.entries(allSuggestions)
      .sort(([, a], [, b]) => b - a)
      .map(([key]) => {
        const index = symptoms.indexOf(key);
        return index >= 0 ? {
          key,
          name_vn: symptomsVn[index],
        } : null;
      })
      .filter((s) => s !== null)
      .filter(
        (s) => !selectedSymptoms.some((selected) => selected.key === s!.key)
      ) as Array<{ key: string; name_vn: string }>;

    return sortedSuggestions.slice(0, 4);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText("");
    addMessage("user", userMessage, {});

    setIsLoading(true);

    try {
      // Parse symptoms from text
      const parseResult = await diseaseService.parseSymptoms(
        userMessage,
        selectedSymptoms.map((s) => s.key)
      );

      if (parseResult.matched_symptoms.length > 0) {
        // Add matched symptoms to selection
        const newSymptoms = parseResult.matched_symptoms
          .map((key, index) => ({
            key,
            name_vn: parseResult.matched_symptoms_vn[index],
          }))
          .filter(
            (s) => !selectedSymptoms.some((selected) => selected.key === s.key)
          );

        setSelectedSymptoms((prev) => [...prev, ...newSymptoms]);

        const suggestions = parseResult.suggestions
          .slice(0, 4)
          .map((key, index) => ({
            key,
            name_vn: parseResult.suggestions_vn[index],
          }));

        addMessage(
          "ai",
          `Tôi hiểu bạn có các triệu chứng: ${parseResult.matched_symptoms_vn.join(
            ", "
          )}. Bạn có muốn thêm triệu chứng nào khác không?`,
          {
            suggestions,
          }
        );
      } else {
        addMessage(
          "ai",
          "Tôi chưa hiểu rõ triệu chứng bạn mô tả. Bạn có thể chọn từ các triệu chứng phổ biến dưới đây không?",
          {
            suggestions: symptoms.slice(0, 5).map((key, index) => ({
              key,
              name_vn: symptomsVn[index],
            })),
          }
        );
      }
    } catch (error) {
      addMessage(
        "ai",
        "Xin lỗi, tôi gặp khó khăn trong việc hiểu triệu chứng của bạn. Vui lòng thử lại.",
        {}
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnosis = async () => {
    if (selectedSymptoms.length === 0) {
      addMessage(
        "ai",
        "Bạn cần chọn ít nhất một triệu chứng để tôi có thể đưa ra chẩn đoán.",
        {}
      );
      return;
    }

    setIsLoading(true);
    addMessage("ai", "Đang phân tích các triệu chứng của bạn...", {});

    try {
      const symptomKeys = selectedSymptoms.map((s) => s.key);
      const diagnosis = await diseaseService.predictDisease(symptomKeys);

      addMessage(
        "ai",
        `Dựa trên các triệu chứng bạn mô tả, tôi dự đoán bạn có thể mắc: **${
          diagnosis.predicted_disease_vn
        }** với độ tin cậy ${(diagnosis.confidence * 100).toFixed(1)}%.`,
        {
          diagnosis,
        }
      );
    } catch (error: any) {
      addMessage(
        "ai",
        "Xin lỗi, tôi gặp lỗi khi phân tích triệu chứng. Vui lòng thử lại.",
        {}
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSelectedSymptoms([]);
    setInputText("");
    initializeChat();
  };

  if (serviceAvailable === false) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-semibold">Chẩn đoán bệnh AI</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-lg text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Dịch vụ AI không khả dụng
            </h3>
            <p className="text-gray-600 mb-4">
              Không thể kết nối đến dịch vụ chẩn đoán. Vui lòng thử lại sau.
            </p>
            <button
              onClick={initializeChat}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Chẩn đoán bệnh AI</h1>
          <button
            onClick={resetChat}
            className="text-blue-100 hover:text-white text-sm"
          >
            Bắt đầu lại
          </button>
        </div>
        {selectedSymptoms.length > 0 && (
          <div className="mt-2">
            <p className="text-blue-100 text-sm">
              Triệu chứng đã chọn ({selectedSymptoms.length}):
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedSymptoms.map((symptom) => (
                <span
                  key={symptom.key}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                >
                  {symptom.name_vn}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                message.type === "user"
                  ? "flex-row-reverse space-x-reverse"
                  : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === "user" ? "bg-blue-600" : "bg-green-600"
                }`}
              >
                {message.type === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              <div
                className={`rounded-lg p-3 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border shadow-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Symptom suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500">Gợi ý triệu chứng:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion) => {
                        const isSelected = selectedSymptoms.some(
                          (s) => s.key === suggestion.key
                        );
                        return (
                          <button
                            key={suggestion.key}
                            onClick={() => handleSymptomSelect(suggestion)}
                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                              isSelected
                                ? "bg-blue-100 text-blue-700 border-blue-300"
                                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            )}
                            {suggestion.name_vn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Diagnosis results */}
                {message.diagnosis && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <p className="text-sm font-medium text-green-800">
                        {message.diagnosis.predicted_disease_vn}
                      </p>
                      <p className="text-xs text-green-600">
                        Độ tin cậy:{" "}
                        {(message.diagnosis.confidence * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-xs text-gray-600">
                      <p className="font-medium">Top dự đoán khác:</p>
                      {message.diagnosis.top_predictions
                        .slice(1, 4)
                        .map((pred, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{pred.disease_vn}</span>
                            <span>{(pred.probability * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Kết quả chỉ mang tính tham khảo. Vui lòng tham khảo ý
                        kiến bác sĩ.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">
                    AI đang suy nghĩ...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white p-4">
        {selectedSymptoms.length > 0 && (
          <div className="mb-3 flex gap-2">
            <button
              onClick={handleDiagnosis}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-sm"
            >
              Chẩn đoán ngay
            </button>
            {selectedSymptoms.length > 1 && (
              <button
                onClick={() => {
                  const combinedSuggestions = getCombinedSuggestions();
                  if (combinedSuggestions.length > 0) {
                    addMessage(
                      "ai",
                      `Dựa trên ${selectedSymptoms.length} triệu chứng bạn đã chọn, tôi gợi ý thêm các triệu chứng có thể liên quan:`,
                      {
                        suggestions: combinedSuggestions,
                      }
                    );
                  } else {
                    addMessage(
                      "ai",
                      "Bạn đã chọn đủ triệu chứng rồi. Hãy thực hiện chẩn đoán để xem kết quả!",
                      {}
                    );
                  }
                }}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm"
              >
                Gợi ý thêm triệu chứng
              </button>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Nhập triệu chứng (VD: Tôi bị ho, sốt, đau đầu)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatDiagnosisPage;
