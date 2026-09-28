import userStore from '$lib/stores/user-store';
import type { Passkey } from '$lib/types/passkey.type';
import type { User } from '$lib/types/user.type';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import APIService from './api-service';

class WebAuthnService extends APIService {
	getRegistrationOptions = async () => (await this.api.get(`/webauthn/register/start`)).data;

	finishRegistration = async (body: RegistrationResponseJSON) =>
		(await this.api.post(`/webauthn/register/finish`, body)).data as Passkey;

	getLoginOptions = async () => (await this.api.get(`/webauthn/login/start`)).data;

	finishLogin = async (body: AuthenticationResponseJSON) =>
		(await this.api.post(`/webauthn/login/finish`, body)).data as User;

	logout = async () => {
		const { frontchannelLogoutURLs } = (await this.api.post(`/webauthn/logout`)).data as {
			frontchannelLogoutURLs: string[];
		};
		if (frontchannelLogoutURLs.length === 1) {
			window.location.assign(frontchannelLogoutURLs[0]);
			return;
		}
		await Promise.all(
			frontchannelLogoutURLs.map(
				(url) =>
					new Promise<void>((resolve) => {
						const iframe = document.createElement('iframe');
						iframe.hidden = true;
						iframe.onload = iframe.onerror = () => {
							iframe.remove();
							resolve();
						};
						document.body.append(iframe);
						iframe.src = url;
						setTimeout(() => {
							iframe.remove();
							resolve();
						}, 5000);
					})
			)
		);
		userStore.clearUser();
	};

	listCredentials = async () => (await this.api.get(`/webauthn/credentials`)).data as Passkey[];

	removeCredential = async (id: string) => {
		await this.api.delete(`/webauthn/credentials/${id}`);
	};

	updateCredentialName = async (id: string, name: string) => {
		await this.api.patch(`/webauthn/credentials/${id}`, { name });
	};

	reauthenticate = async (body?: AuthenticationResponseJSON) => {
		await this.api.post('/webauthn/reauthenticate', body);
	};
}

export default WebAuthnService;
