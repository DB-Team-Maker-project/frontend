// src/pages/SignupPage.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    studentId: '', password: '', confirmPassword: '', name: '',
    gender: '', contact: '', bio: ''
  });
  const navigate = useNavigate();
  const { signup } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "studentId") {
        if (!/^\d*$/.test(value) || value.length > 12) return;
    } else if (name === "contact") {
        if (!/^\d*$/.test(value) || value.length > 12) return;
    } else if (name === "name" && value.length > 6) {
        return;
    } else if (name === "bio" && value.length > 100) {
        return;
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다."); return;
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/;
    if (!passwordRegex.test(formData.password)) {
      alert("비밀번호는 숫자와 영문을 혼용하여 8~12자리로 입력해주세요."); return;
    }
    if (!formData.studentId || !formData.name || !formData.gender || !formData.contact) {
        alert("학번, 이름, 성별, 연락처는 필수 항목입니다."); return;
    }

    const { confirmPassword, ...userData } = formData;
    if (signup(userData)) {
      navigate('/login');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '550px', margin: '40px auto', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>회원가입</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" name="studentId" placeholder="학번 (숫자, 최대 12자리)" value={formData.studentId} onChange={handleChange} maxLength="12" required style={{padding: '10px'}}/>
        <input type="password" name="password" placeholder="비밀번호 (영문/숫자 혼용 8~12자리)" value={formData.password} onChange={handleChange} minLength="8" maxLength="12" required style={{padding: '10px'}}/>
        <input type="password" name="confirmPassword" placeholder="비밀번호 확인" value={formData.confirmPassword} onChange={handleChange} required style={{padding: '10px'}}/>
        <input type="text" name="name" placeholder="이름 (최대 6자)" value={formData.name} onChange={handleChange} maxLength="6" required style={{padding: '10px'}}/>
        <select name="gender" value={formData.gender} onChange={handleChange} required style={{padding: '10px'}}>
          <option value="">성별 선택</option>
          <option value="남성">남성</option>
          <option value="여성">여성</option>
        </select>
        <input type="text" name="contact" placeholder="연락처 (숫자, 최대 12자리)" value={formData.contact} onChange={handleChange} maxLength="12" required style={{padding: '10px'}}/>
        <textarea name="bio" placeholder="자기소개 (최대 100자)" value={formData.bio} onChange={handleChange} maxLength="100" rows="4" style={{padding: '10px', resize: 'vertical'}}/>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={() => navigate('/login')} style={{ padding: '10px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>취소</button>
          <button type="submit" style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>완료</button>
        </div>
      </form>
    </div>
  );
};
export default SignupPage;