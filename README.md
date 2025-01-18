# React-Auth-FaceId

This is a library for authentication using Face ID in React applications.

## How does it work?

First, a request is sent to retrieve a reference image. This image is used to identify the person in front of the camera by comparing them with the reference image. If a match is found, a second request is sent, which, for example, returns a token for authentication.

```js
import { FaceId } from 'react-auth-faceid';

const App: FC = () => {
	const handleSuccess = (token: string) => {
		console.log({ 'Token received': token });
	};

	const handleError = (error: string) => {
		console.error({ error });
	};

	return (
		<FaceId
			fetchReference={{
				url: 'https://example.com/api/image',
			}}
			validateFace={{
				url: 'https://example.com/api/validate',
				body: '',
				method: 'POST',
				headers: {},
			}}
			onSuccess={handleSuccess}
			onError={handleError}
			timeFaceId={5000}
			styleButton={{ color: 'red' }}
			styleCanvas={{ display: 'none' }}
			styleVideo={{ width: '300px' }}
			modelsPath='/models'
		/>
	);
};
```

The **modelsPath** prop is used to specify the path to the models in your application. To make it work, you need to download all the models and add them to your project. You can [download them](https://github.com/liveMusic13/react-auth-faceid/tree/main/public/models) from the project's repository.

The **onSuccess** and **onError** functions are used to handle successful and failed requests. The **timeFaceId** prop sets the time (in milliseconds) during which face recognition is active. The **fetchReference** request is used to obtain the reference image, while the **validateFace** request checks if the user matches the reference image.
