import http from 'k6/http';
import { check, sleep } from 'k6';

// Options for Baseline / Load Testing: 100 Virtual Users running continuously for 1 minute
export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'],       // Failure rate must be under 5%
    http_req_duration: ['p(95)<1500'],     // 95th percentile response time under 1.5s (1500ms)
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'https://GOUTHAM10K.github.io/DentConnect/';
  
  // Clean trailing slashes
  const targetUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  // Perform HTTP GET request against live deployment
  const res = http.get(targetUrl, {
    headers: {
      'User-Agent': 'k6-LoadTest-Bot/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  // Verify response HTTP status is 200 OK
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body size > 0': (r) => r.body && r.body.length > 0,
  });

  // Pacing pause between requests
  sleep(0.5);
}
