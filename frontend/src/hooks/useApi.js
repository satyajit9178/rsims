import { useDemo } from '../context/DemoContext';
import * as realApi from '../services/api';
import * as demoApi from '../services/demoApi';

export function useApi() {
  const { isDemo } = useDemo();
  return isDemo ? demoApi : realApi;
}