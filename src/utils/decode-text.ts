import { decodeText } from '../encoders/text-decoder';

// The text to decode
const text = `
	3.16. Áåñïðîâîäíûå ñåòè
		1
		2
		3
		4
		5
		6
		7
		14
		15
		16
		17
		10
		11
		11
		11
		11
	4.15. Õ.25
		2
		2
		3
		4
		5
		6
		7
	0. Âõîäíîé òåñò
		1
		2
		3

Íàçâàíèå=ÒÅËÅÊÎÌÌÓÍÈÊÀÖÈÎÍÍÛÅ ÑÈÑÒÅÌÛ
Àâòîðû=Àëèåâ Ò.È.  
Êîïèðàéò=Ðàçäåë 1
Äàòà=2021 ãîä
`;

console.log('=== win1251 ===');
console.log(decodeText(text));

// console.log('\n=== koi8-r ===');
// console.log(decodeText(text, 'latin1', 'koi8-r'));
//
// console.log('\n=== cp866 ===');
// console.log(decodeText(text, 'latin1', 'cp866'));
//
// console.log('\n=== iso-8859-5 ===');
// console.log(decodeText(text, 'latin1', 'iso-8859-5'));

// Uncomment to try utf8
// console.log('\n=== utf8 ===');
// console.log(decodeText(text, 'latin1', 'utf8'));
