'use client';

import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Image from 'next/image';
import { supabase } from '@/contexts/supabase.context';
import { v4 as uuidv4 } from 'uuid';
import KakaoMap from '@/components/common/KakaoMap';
import { useRouter } from 'next/navigation';

const EditPage: NextPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const productId = params.id; // 상품 ID를 파라미터에서 가져옴
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [contents, setContents] = useState('');
  const [markerPosition, setMarkerPosition] = useState({ latitude: 0, longitude: 0 });
  const [address, setAddress] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    // 기존 상품 데이터 불러오기
    const fetchProductData = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();

      if (error) {
        console.error('상품 데이터 불러오기 오류:', error);
      } else {
        setTitle(data.title);
        setCategory(data.category);
        setPrice(data.price.toString());
        setContents(data.contents);
        setMarkerPosition({ latitude: data.latitude, longitude: data.longitude });
        setAddress(data.address);
      }

      // 기존 이미지 데이터 불러오기
      const { data: imageData, error: imageError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (imageError) {
        console.error('이미지 데이터 불러오기 오류:', imageError);
      } else {
        setImages(imageData.map((img) => img.image_url));
      }
    };

    fetchProductData();
  }, [productId]);

  // 이미지 업로드 함수
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
      setSelectedFiles([...selectedFiles, ...Array.from(files)]);
    }
  };

  // 이미지 삭제 함수
  const handleImageClick = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newSelectedFiles = [...selectedFiles];
    newSelectedFiles.splice(index, 1);
    setSelectedFiles(newSelectedFiles);
  };

  const handleNext = () => {
    if (currentIndex < images.length - 4) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMarkerPositionChange = (position: { lat: number; lng: number; address: string }) => {
    setMarkerPosition({ latitude: position.lat, longitude: position.lng });
    setAddress(position.address); // 주소 정보 업데이트
  };

  // 폼 제출 처리
  const handleSubmit = async () => {
    console.log('제목:', title);
    console.log('카테고리:', category);
    console.log('금액:', price);
    console.log('내용:', contents);
    console.log('주소:', address);
    console.log('이미지:', images);
    console.log('마커 위치:', markerPosition);

    if (title && category && price && contents && address && images.length > 0) {
      if (confirm('작성을 완료하시겠습니까?')) {
        try {
          // 기존 상품 업데이트
          const { error: updateError } = await supabase
            .from('products')
            .update({
              title,
              category,
              price: parseFloat(price),
              contents,
              latitude: markerPosition.latitude,
              longitude: markerPosition.longitude,
              address
            })
            .eq('id', productId);

          if (updateError) {
            throw updateError;
          }

          console.log('상품 데이터를 업데이트했습니다:', productId);

          // 이미지 데이터 업로드 및 업데이트
          const imageUrls = await Promise.all(selectedFiles.map((file) => imageUpload(file)));
          if (imageUrls.length !== selectedFiles.length) {
            throw new Error('이미지 업로드 중 문제가 발생했습니다.');
          }

          const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', productId);

          if (deleteError) {
            throw deleteError;
          }

          const imageInsertData = imageUrls.map((imageUrl) => ({
            product_id: productId,
            image_url: imageUrl
          }));

          const { error: insertError } = await supabase.from('product_images').insert(imageInsertData);

          if (insertError) {
            throw insertError;
          }

          console.log('이미지 데이터를 저장했습니다.');

          // 필드 초기화
          setTitle('');
          setCategory('');
          setPrice('');
          setContents('');
          setAddress('');
          setImages([]);
          setSelectedFiles([]);
          setCurrentIndex(0);
          setMarkerPosition({ latitude: 0, longitude: 0 });

          console.log('모든 데이터 저장을 완료했습니다.');
          router.push('/');
        } catch (error) {
          console.error('데이터 저장 중 오류 발생:', error.message);
        }
      } else {
        console.log('작성이 취소되었습니다.');
      }
    } else {
      alert('제목, 카테고리, 금액, 내용, 주소 및 사진을 모두 입력해주세요.');
    }
  };

  // 이미지 업로드 함수
  const imageUpload = async (selectedFile: File) => {
    const filePath = `products/${uuidv4()}_${Date.now()}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, selectedFile);
    if (uploadError) {
      console.error('업로드 에러:', uploadError);
      throw uploadError;
    }

    const { data } = await supabase.storage.from('avatars').getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      console.error('public URL 반환 에러');
      throw new Error('public URL을 가져올 수 없습니다.');
    }

    return data.publicUrl;
  };

  return (
    <div className="flex flex-col h-[800px]">
      <div className="flex-grow relative border-2 border-bg-main mx-20 mt-10 mb-2 rounded-lg flex flex-col">
        <div className="absolute top-4 left-4 z-10">
          <p className="text-xl font-bold text-gray-800">내 글 수정하기</p>
        </div>
        <div className="absolute top-20 left-5 z-10 w-1/3 space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="title" className="text-sm text-gray-700">
              제목
            </label>
            <input
              type="text"
              id="title"
              className="border border-gray-300 px-2 py-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="category" className="text-sm text-gray-700">
              카테고리
            </label>
            <select
              id="category"
              className="border border-gray-300 px-2 py-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">카테고리를 선택하세요</option>
              <option value="경제경영">경제경영</option>
              <option value="만화">만화</option>
              <option value="사회과학">사회과학</option>
              <option value="소설/시/희곡">소설/시/희곡</option>
              <option value="어린이">어린이</option>
              <option value="에세이">에세이</option>
              <option value="유아">유아</option>
              <option value="인문학">인문학</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="price" className="text-sm text-gray-700">
              금액
            </label>
            <input
              type="text"
              id="price"
              className="border border-gray-300 px-2 py-1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="contents" className="text-sm text-gray-700">
              내용
            </label>
            <textarea
              id="contents"
              rows={4}
              className="border border-gray-300 px-2 py-1"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
            />
          </div>
        </div>
        <div className="absolute top-20 right-16 z-10 w-538">
          <div className="flex flex-col space-y-1">
            <label htmlFor="image" className="text-sm text-gray-600">
              사진 등록
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              className="border border-gray-400 px-2 py-1 rounded-md"
              multiple
              onChange={handleImageUpload} // 이미지 업로드 핸들러 연결
            />
            <div className="mt-2 relative" style={{ width: '538px' }}>
              {images.length > 4 && currentIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 p-1 bg-transparent focus:outline-none"
                >
                  {'<'}
                </button>
              )}
              <div className="flex space-x-0">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="w-40 h-32 border border-gray-300 rounded-md overflow-hidden">
                    {images[currentIndex + index] && (
                      <div className="relative" onClick={() => handleImageClick(currentIndex + index)}>
                        <Image
                          src={images[currentIndex + index]}
                          alt={`preview-${index}`}
                          width={300}
                          height={300}
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm cursor-pointer hover:bg-opacity-70">
                          삭제
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {currentIndex < images.length - 4 && (
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 p-1 bg-transparent focus:outline-none"
                >
                  {'>'}
                </button>
              )}
              <div className="absolute top-44 bottom-0 left-0 right-0 z-0">
                <p className="text-gray-600">거래 희망 위치</p>
                <KakaoMap onMarkerAddressChange={handleMarkerPositionChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-main text-white rounded-md shadow hover:bg-hover focus:outline-none"
          >
            수정 완료
          </button>
        </div>
        <hr className="border-t-2 border-gray mt-14 mb-8" />
      </div>
    </div>
  );
};

export default EditPage;
