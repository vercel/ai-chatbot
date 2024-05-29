'use client';

import {
    EyeOpenIcon,
    EyeNoneIcon
} from "@radix-ui/react-icons"

// import { LOGIN_URL } from '../constants/urls';
import { useState } from 'react';
import { Oval } from 'react-loader-spinner';
import { useRouter } from 'next/navigation';
import { SuperBrainLogo } from '../assets/logo/SuperBrain';

export default function Login() {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const router = useRouter();

//   useEffect(() => {
//     const getLocalAuth = localStorage?.getItem('auth');
//     if (getLocalAuth === 'true') {
//       router.push('/');
//     }
//   }, [router]);

//   const handleLogin = async () => {
//     setError(false);
//     if (loginData.email && loginData.password) {
//       try {
//         setLoading(true);
//         const response = await fetch(LOGIN_URL, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(loginData)
//         });
//         if (response.status === 200) {
//           // Redirect the user or perform any necessary action upon successful login
//           setLoading(false);
//           window.open('https://app.krill.ai/', '_self');
//           console.log('Login successful!');
//           localStorage?.setItem('auth', 'true');
//         } else {
//           // Handle login error, maybe display a message to the user
//           setLoading(true);
//           setError(true);
//           console.error('Login failed');
//         }
//       } catch (error) {
//         setLoading(true);
//         console.error('An error occurred:', error);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  return (
    <div className="grid place-items-center h-[100vh] bg-white">
      <div className="login w-full max-w-md overflow-hidden rounded-2xl text-xl border border-gray-100 p-12">
        <div className="text-center">
          <div className="logo flex justify-center mb-8">
            <SuperBrainLogo  width="190px"/>
          </div>
        </div>
        <div className="username w-full mb-4 ">
          <input
            type="email"
            className="mt-1 block h-[45px] selection:bg-white w-full appearance-none bg-white rounded-md border text-black border-gray-200 px-3 py-2 placeholder-gray-400  focus:border-black focus:outline-none focus:ring-black sm:text-sm"
            placeholder="latte@trianglehq.co"
            name="email"
            value={loginData.email}
            onChange={handleInputChange}
          ></input>
        </div>
        <div className="password w-full mb-4 relative">

          <input
            type={isShowPassword ? 'text' : 'password'}
            maxLength={30}
            className="mt-1 block w-full h-[45px] appearance-none rounded-md bg-white border text-black border-gray-200 px-3 py-2 placeholder-gray-400  focus:border-black focus:outline-none focus:ring-black sm:text-sm"
            name="password"
            placeholder="Passoword"
            value={loginData.password}
            onChange={handleInputChange}
          ></input>
          <div
            className="passord-view absolute right-[10px] top-[15px] cursor-pointer"
            onClick={() => setIsShowPassword(!isShowPassword)}
          >
            {isShowPassword ? (
              <EyeOpenIcon color="grey" width={16} />
            ) : (
              <EyeNoneIcon color="grey" width={16} />
            )}
          </div>
        </div>
        {error && (
          <div className="error text-red-500 text-sm mb-8">
            username or password is incorrect
          </div>
        )}
        <button
          className="p-2 font-bold flex gap-2 h-[45px] mt-8 items-center justify-center w-full text-white bg-black dark:bg-white dark:text-black rounded-md border text-sm transition-all focus:outline-none"
        //   onClick={handleLogin}
        onClick={() => router.push('/chat')}
        >
          Login
          {loading ? (
            <Oval width={24} height={24} color="black" secondaryColor="grey" />
          ) : null}
        </button>
      </div>
    </div>
  );
}