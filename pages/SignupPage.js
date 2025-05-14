// src/pages/SignupPage.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App'; // AuthContext에서 signup 함수, isLoading 가져오기

const SignupPage = () => {
  const [formData, setFormData] = useState({
    studentId: '', password: '', confirmPassword: '', name: '',
    gender: '', contact: '', languages: '', mbti: '', career: '', bio: '' // FastAPI 모델에 맞게 추가
  });
  const navigate = useNavigate();
  const { signup, isLoading, setIsLoading } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // 입력값 유효성 검사 (기존 로직 유지 또는 강화)
    if (name === "studentId" && (!/^\d*$/.test(value) || value.length > 12)) return;
    if (name === "contact" && (!/^\d*$/.test(value) || value.length > 12)) return; // FastAPI 모델은 phone_number
    if (name === "name" && value.length > 6) return; // FastAPI 모델은 길이 제한 없음
    if (name === "bio" && value.length > 100) return; // FastAPI 모델은 intro

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // 필수 필드 검사 (FastAPI 스키마 기반)
    const requiredFields = ['studentId', 'password', 'name', 'gender', 'contact'];
    for (const field of requiredFields) {
        if (!formData[field]) {
            alert(`${field} 필드는 필수입니다.`);
            return;
        }
    }

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다."); return;
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/; // 요청사항 기반
    if (!passwordRegex.test(formData.password)) {
      alert("비밀번호는 숫자와 영문을 혼용하여 8~12자리로 입력해주세요."); return;
    }

    const signupData = { ...formData };
    delete signupData.confirmPassword; // confirmPassword는 백엔드로 보내지 않음

    const success = await signup(signupData); // App.js의 signup 함수 호출
    if (success) {
      navigate('/login');
    }
  };

  const inputStyle = { padding: '10px', fontSize: '1em', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '30px', maxWidth: '550px', margin: '40px auto', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>회원가입</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" name="studentId" placeholder="학번 (숫자, 최대 12자리)" value={formData.studentId} onChange={handleChange} style={inputStyle} maxLength="12" required disabled={isLoading} />
        <input type="password" name="password" placeholder="비밀번호 (영문/숫자 혼용 8~12자리)" value={formData.password} onChange={handleChange} style={inputStyle} minLength="8" maxLength="12" required disabled={isLoading}/>
        <input type="password" name="confirmPassword" placeholder="비밀번호 확인" value={formData.confirmPassword} onChange={handleChange} style={inputStyle} required disabled={isLoading}/>
        <input type="text" name="name" placeholder="이름 (최대 6자)" value={formData.name} onChange={handleChange} style={inputStyle} maxLength="6" required disabled={isLoading}/>
        <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle} required disabled={isLoading}>
          <option value="">성별 선택</option> <option value="남성">남성</option> <option value="여성">여성</option>
        </select>
        <input type="text" name="contact" placeholder="연락처 (숫자, 예: 01012345678)" value={formData.contact} onChange={handleChange} style={inputStyle} maxLength="12" required disabled={isLoading}/>
        <input type="text" name="languages" placeholder="사용 가능 언어 (예: Python, Java)" value={formData.languages} onChange={handleChange} style={inputStyle} disabled={isLoading}/>
        <input type="text" name="mbti" placeholder="MBTI (예: INFP)" value={formData.mbti} onChange={handleChange} style={inputStyle} maxLength="4" disabled={isLoading}/>
        <input type="text" name="career" placeholder="경력 사항 (예: 1년차 웹 개발자)" value={formData.career} onChange={handleChange} style={inputStyle} disabled={isLoading}/>
        <textarea name="bio" placeholder="자기소개 (최대 100자)" value={formData.bio} onChange={handleChange} style={{...inputStyle, resize: 'vertical', minHeight: '80px'}} maxLength="100" rows="3" disabled={isLoading}/>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={() => navigate('/login')} style={{ padding: '10px 15px', background: '#6c757d', color: 'white' }} disabled={isLoading}>취소</button>
          <button type="submit" style={{ padding: '10px 15px', background: '#007bff', color: 'white' }} disabled={isLoading}>
            {isLoading ? "가입 처리 중..." : "완료"}
          </button>
        </div>
      </form>
    </div>
  );
};
export default SignupPage;