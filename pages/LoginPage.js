// src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App'; // App.js에서 export한 AuthContext

const LoginPage = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext); // isLoading 추가
  // const navigate = useNavigate(); // App.js의 Route가 리디렉션하므로 직접 사용 안함

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!studentId || !password) {
        alert("학번과 비밀번호를 모두 입력해주세요.");
        return;
    }
    await login(studentId, password);
    // 로그인 성공/실패 처리는 login 함수 내부와 App.js의 Route에서 리디렉션으로 처리
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3.5em', marginBottom: '30px' }}>TEAMGETHER</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '320px', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <input
          type="text"
          placeholder="학번"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          style={{ padding: '12px', fontSize: '1em', border: '1px solid #ccc', borderRadius: '4px' }}
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '12px', fontSize: '1em', border: '1px solid #ccc', borderRadius: '4px' }}
          disabled={isLoading}
        />
        <button type="submit" style={{ padding: '12px', fontSize: '1.1em', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={isLoading}>
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
      </form>
      <Link to="/signup" style={{ marginTop: '25px', fontSize: '0.95em', color: '#007bff', textDecoration: 'none' }}>회원가입</Link>
    </div>
  );
};
export default LoginPage;