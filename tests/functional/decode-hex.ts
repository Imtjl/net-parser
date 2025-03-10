import { decodeHexString } from '../../src/index';

const gr_id = `
050000003c6f7074696f6e733e0d0a6e3d340d0a747970653d370d0a72696768743d340d0a6d61783d320d0a3c2f6f707469
6f6e733e0d0a3c76616c75653e0d0a310d0a310d0a310d0a310d0a3c2f76616c75653e0d0a3c7175657374696f6e3e0d0aca
e0ea20ede0e7fbe2e0e5f2f1ff20efe5f0e2fbe920f3f0eee2e5edfc204f53492deceee4e5ebe83f20203c62723e0d0a2a20
c220eae0f7e5f1f2e2e520eef2e2e5f2e02020e2e2e5e4e8f2e520eee4edee20f1ebeee2ee2028eff0e8ebe0e3e0f2e5ebfc
edeee520e220e8ece5ede8f2e5ebfcedeeec20efe0e4e5e6e5290d0a3c2f7175657374696f6e3e0d0a3c6465736372697074
696f6e3e0d0a3c2f6465736372697074696f6e3e0d0a3c615f313e0d0af4e8e7e8f7e5f1eae8e90d0a0d0a0d0a0d0a0d0a3c
2f615f313e0d0a3c615f323e0d0ad4e8e7e8f7e5f1eae8e90d0a0d0a0d0a0d0a0d0a3c2f615f323e0d0a3c615f333e0d0a70
6879736963616c0d0a0d0a0d0a0d0a3c2f615f333e0d0a3c615f343e0d0a5048590d0a0d0a0d0a0d0a3c2f615f343e0d0a
`;

// Try with different encodings
console.log('=== win1251 (Default) ===');
console.log(decodeHexString(gr_id));

// console.log('\n=== koi8-r ===');
// console.log(decodeHexString(hexContent, 'koi8-r'));
//
// console.log('\n=== utf8 ===');
// console.log(decodeHexString(hexContent, 'utf8'));
