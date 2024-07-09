'use client';

import Page from '@/components/MyPage/Page';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/contexts/supabase.context';
import Image from 'next/image';

function ProfilePage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | ArrayBuffer | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>('550e8400-e29b-41d4-a716-446655440000');
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [notification, setNotification] = useState('');

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     const {
  //       data: { session },
  //       error
  //     } = await supabase.auth.getSession();
  //     if (session) {
  //       const user = session.user;
  //       setUserId(user.id);
  //       const { data, error } = await supabase
  //         .from('users')
  //         .select('nickname, address, profile_url')
  //         .eq('id', user.id)
  //         .single();
  //       if (data) {
  //         setNickname(data.nickname);
  //         setAddress(data.address);
  //         setSelectedImage(data.profile_url);
  //       }
  //     } else {
  //       console.error('No session found:', error);
  //     }
  //   };
  //   fetchUserData();
  // }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const testUserId = '550e8400-e29b-41d4-a716-446655440000';
      if (testUserId) {
        setUserId(testUserId);
        const { data, error } = await supabase
          .from('users')
          .select('nickname, address, profile_url')
          .eq('id', testUserId)
          .single();
        if (data) {
          setNickname(data.nickname);
          setAddress(data.address);
          setSelectedImage(data.profile_url);
        }
      } else {
        console.error('No user found');
      }
    };
    fetchUserData();
  }, []);

  const openModal = () => {
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !userId || !selectedFile) return;

    const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `profiles/${userId}/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, selectedFile);
    if (uploadError) {
      console.error('업로드에러 :', uploadError);
      setNotification('업로드 중 에러가 발생했습니다.');
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      console.error('public URL 반환에러');
      return;
    }

    const publicURL = data.publicUrl;

    const { error: updateError } = await supabase.from('users').update({ profile_url: publicURL }).eq('id', userId);
    if (updateError) {
      console.error('프로필 URL을 업데이트하는 중 오류:', updateError);
      return;
    }
    setNotification('프로필 이미지가 변경되었습니다.');
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (userId) {
      const { error } = await supabase.from('users').update({ nickname, address }).eq('id', userId);
      if (error) {
        console.error('사용자 데이터를 업데이트하는 중 오류:', error);
      } else {
        setNotification('프로필 정보가 변경되었습니다.');
      }
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <Page title="프로필 수정">
      <div className="flex mt-1 items-start justify-center">
        <div className="w-96 bg-white p-6">
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="relative w-48 h-48 border-solid border-2">
                {selectedImage ? (
                  <Image
                    src={selectedImage as string}
                    alt="Profile"
                    className="object-cover w-full h-full"
                    width={160}
                    height={160}
                    priority
                  />
                ) : (
                  <Image
                    src="/assets/img/profile-Image.png"
                    alt="Profile"
                    className="object-cover w-full h-full"
                    width={160}
                    height={160}
                    priority
                  />
                )}{' '}
              </div>
            </div>
            <button
              onClick={openModal}
              className="text-sm mt-1 text-gray-600 border-solid border-2 rounded-md hover:bg-hover w-48 h-9"
            >
              프로필사진 변경
            </button>
          </div>
          <div className="mt-6">
            <div className="mb-4">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-main rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                주&nbsp;&nbsp;&nbsp;소
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-main rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-500"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 px-4 bg-main text-white font-semibold rounded-md shadow-sm hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-main"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-10 rounded-lg shadow-lg">
            <h2 className="text-lg text-gray-900 mb-4 text-center font-bold">프로필 이미지 변경</h2>
            <div className="w-64 h-64 bg-gray-300 mb-4 rounded-lg flex items-center justify-center">
              {selectedImage ? (
                <Image
                  src={selectedImage as string}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-lg"
                  width={256}
                  height={256}
                />
              ) : (
                <span className="text-gray-400">미리보기</span>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" id="file-input" onChange={handleImageChange} />
            <label
              htmlFor="file-input"
              className="mb-4 px-4 py-2 border rounded-lg flex items-center justify-center cursor-pointer"
            >
              <Image src="/assets/img/plus.png" alt="PlusIcon" width={12} height={12} className="mr-2" />
              이미지 가져오기
            </label>
            <div className="flex space-x-2">
              <button
                onClick={handleImageUpload}
                className="w-full py-2 px-4 bg-main text-white font-semibold rounded-md shadow-sm hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-main"
              >
                저장
              </button>
              <button
                onClick={closeModal}
                className="w-full py-2 px-4  bg-main text-white font-semibold rounded-md shadow-sm hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-main"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-5 right-5 bg-main text-white px-8 py-6 rounded shadow z-50 w-72">
          {notification}
          <div className="h-1 bg-white mt-2 rounded-full overflow-hidden w-full">
            <div className="bg-gray-400 h-full animate-shrink"></div>
          </div>
        </div>
      )}
    </Page>
  );
}

export default ProfilePage;
