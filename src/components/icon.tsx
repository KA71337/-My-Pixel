type IconName = 'up-right' | 'right' | 'left' | 'down' | 'check' | 'search' | 'refresh';
const paths: Record<IconName, string> = {
  'up-right': 'M7 17 17 7M7 7h10v10',
  right: 'M5 12h14m-6-6 6 6-6 6',
  left: 'M19 12H5m6-6-6 6 6 6',
  down: 'm6 9 6 6 6-6',
  check: 'm5 12 4 4L19 6',
  refresh: 'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M18 18a8 8 0 0 1-13-2',
  search: 'm16 16 4 4M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
};
export function Icon({name = 'up-right'}: {name?: IconName}) {
  return <svg className="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;
}
