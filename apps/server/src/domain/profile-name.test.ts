import { expect, test } from 'bun:test';
import { splitProfileName } from './profile-name';
test('registration names preserve compound surnames and normalize whitespace', () => {
  expect(splitProfileName('  Anna\tMaria Kowalska-Nowak  ')).toEqual({
    firstName: 'Anna',
    lastName: 'Maria Kowalska-Nowak'
  });
  expect(splitProfileName('Łukasz Żółć')).toEqual({ firstName: 'Łukasz', lastName: 'Żółć' });
  expect(splitProfileName('Ada')).toEqual({ firstName: 'Ada', lastName: '' });
  expect(splitProfileName(' ')).toEqual({ firstName: '', lastName: '' });
});
