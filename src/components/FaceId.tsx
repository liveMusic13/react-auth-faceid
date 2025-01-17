import * as faceapi from 'face-api.js';
import { CSSProperties, FC, useEffect, useRef, useState } from 'react';
import Button from './Button';

import styles from './FaceId.module.css';

interface FaceIdProps {
	fetchReferenceUrl: string; // URL для получения референса
	validateFaceUrl: string; // URL для валидации лица
	onSuccess: (token: string) => void; // Callback при успешной валидации
	onError: (error: string) => void; // Callback при ошибке
	styleButton?: CSSProperties;
	styleVideo?: CSSProperties;
	styleCanvas?: CSSProperties;
	timeFaceId: number;
}

const FaceId: FC<FaceIdProps> = ({
	fetchReferenceUrl,
	validateFaceUrl,
	onSuccess,
	onError,
	styleButton,
	styleVideo,
	styleCanvas,
	timeFaceId,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [modelsLoaded, setModelsLoaded] = useState(false);
	const [referenceDescriptor, setReferenceDescriptor] =
		useState<Float32Array | null>(null);
	const [cameraOn, setCameraOn] = useState(false);
	const [recognitionTimeout, setRecognitionTimeout] = useState<number | null>(
		null
	);

	// Загрузка моделей FaceAPI
	useEffect(() => {
		const loadModels = async () => {
			try {
				const MODEL_URL = '/models';
				await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
				await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
				await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
				setModelsLoaded(true);
			} catch (err) {
				onError('Failed to load models');
			}
		};
		loadModels();
	}, [onError]);

	// Получение эталонного изображения с сервера
	const fetchReferenceImage = async () => {
		try {
			const response = await fetch(fetchReferenceUrl);
			if (!response.ok) throw new Error('Failed to fetch reference image');
			const blob = await response.blob();
			const img = new Image();
			img.onload = async () => {
				const detection = await faceapi
					.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
					.withFaceLandmarks()
					.withFaceDescriptor();
				if (detection && detection.descriptor)
					setReferenceDescriptor(detection.descriptor);
				else throw new Error('No face detected in reference image');
			};
			img.src = URL.createObjectURL(blob);
		} catch (err: any) {
			onError(err.message);
		}
	};

	// Включение камеры
	const startVideo = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			if (videoRef.current) videoRef.current.srcObject = stream;
			setCameraOn(true);
			// Таймер для завершения через 10 секунд
			const timeout = window.setTimeout(() => {
				stopVideo();
				onError('Face not recognized within 10 seconds');
			}, timeFaceId);
			setRecognitionTimeout(timeout);
		} catch (err) {
			onError('Failed to access camera');
		}
	};

	// Сравнение лица
	const handleVideoPlay = async () => {
		const video = videoRef.current;
		if (!video || !referenceDescriptor) return;

		const interval = setInterval(async () => {
			try {
				const detection = await faceapi
					.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
					.withFaceLandmarks()
					.withFaceDescriptor();

				if (!detection) {
					// Если лицо не обнаружено, пропускаем итерацию
					console.warn('Лицо не обнаружено');
					return;
				}

				if (detection && detection.descriptor) {
					const distance = faceapi.euclideanDistance(
						detection.descriptor,
						referenceDescriptor
					);
					if (distance < 0.6) {
						clearInterval(interval);
						if (recognitionTimeout !== null) clearTimeout(recognitionTimeout); // Отменяем таймер если лицо распознано
						await sendValidationRequest();
					}
				}
			} catch (err) {
				clearInterval(interval);
				if (recognitionTimeout !== null) clearTimeout(recognitionTimeout); // Отменяем таймер при ошибке
				onError('Face recognition failed');
			}
		}, 1000);
	};

	// Отправка запроса для валидации
	const sendValidationRequest = async () => {
		try {
			const response = await fetch(validateFaceUrl, {
				method: 'POST',
				// body: JSON.stringify({
				// 	grant_type: 'password',
				// 	username: 'test@test.ru',
				// 	password: '123',
				// }),
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `grant_type=password&username=test@test.ru&password=123&scope=&client_id=&client_secret=`,
			});
			if (!response.ok) throw new Error('Validation failed');
			const data = await response.json();
			if (data.token) {
				onSuccess(data.token);
			} else if (data.access_token) {
				onSuccess(data.access_token);
			}
		} catch (err: any) {
			onError(err.message);
		} finally {
			stopVideo();
		}
	};

	// Отключение камеры
	const stopVideo = () => {
		if (videoRef.current && videoRef.current.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			stream.getTracks().forEach(track => track.stop());
			videoRef.current.srcObject = null;
		}
		setCameraOn(false);
		if (recognitionTimeout !== null) clearTimeout(recognitionTimeout); // Отменяем таймер при отключении камеры
	};

	return (
		<div>
			{!modelsLoaded && <p>Loading models...</p>}
			{modelsLoaded && (
				<>
					<Button
						onClick={async () => {
							await fetchReferenceImage();
							await startVideo();
						}}
						style={styleButton}
					>
						Auth
					</Button>
					<video
						className={`${styles.video} ${
							cameraOn ? styles.active : styles.no_active
						}`}
						ref={videoRef}
						onPlay={handleVideoPlay}
						autoPlay
						muted
						style={styleVideo}
					/>
					<canvas
						className={`${cameraOn ? styles.active : styles.no_active}`}
						ref={canvasRef}
						style={styleCanvas}
					/>
				</>
			)}
		</div>
	);
};

export default FaceId;
