const fs = require('fs');
const path = 'app/api/word/route.ts';

let content = fs.readFileSync(path, 'utf8');

// Fix 1: First TableRow closing bracket
content = content.replace(
  `                    })]
                },
                    new TableRow({`,
  `                    })]
                }),
                new TableRow({`
);

// Fix 2: Second TableRow closing + rows array close
content = content.replace(
  `                    })]
                    },
        });`,
  `                    })]
                }),
            ],
        });`
);

fs.writeFileSync(path, content);
console.log('✅ FILE FIX HO GAYI! Ab git push karo.');
