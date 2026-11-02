import axios from 'axios';

/** Axios 오류를 HTTP 검증 오류, 연결 실패, 시간 초과로 구분하여 보여 줍니다. */
export function getAxiosErrorMessage(error: unknown, operation: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : `${operation} 중 알 수 없는 오류가 발생했습니다.`;
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return `${operation} 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.`;
  }
  if (error.code === 'ERR_CANCELED') {
    return `${operation} 요청이 취소되었습니다.`;
  }
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return '서버에 연결할 수 없습니다. 인터넷 연결 또는 서버 상태를 확인해 주세요.';
  }
  const status = error.response.status;
  const data = error.response.data;
  const message = data && typeof data === 'object' && typeof data.message === 'string'
    ? data.message.trim() : '';
  if (status === 400 || status === 422) return message || '요청 조건을 확인하고 다시 시도해 주세요.';
  if (status === 504 || status === 408) return message || `${operation} 시간이 초과되었습니다. 다시 시도해 주세요.`;
  if (status === 429) return message || '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
  if (status === 502 || status === 503) return message || 'AI 또는 추천 서비스를 잠시 이용할 수 없습니다. 다시 시도해 주세요.';
  return `${operation}에 실패했습니다. (HTTP ${status})`;
}
