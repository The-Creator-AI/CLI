import fs from 'fs';
import mockFs from 'mock-fs'; // Import the mock-fs library
import { getIgnorePatterns, isIgnored } from '../ignore';

describe('getIgnorePatterns', () => {
    beforeEach(() => {
    });

    afterEach(() => {
        // Restore the original file system after each test
        mockFs.restore();
    });

    it('should prefer ignore.llm if newer', () => {
        // Set the modification time of 'ignore.llm' to be newer
        // mockFs('/test/dir/ignore.llm', { mtime: new Date(2024, 4, 26) }); // Future date
        mockFs({
            '/test/dir': {
                '.gitignore': mockFs.file({
                    mtime: new Date(2023, 4, 27),
                    content: '*.txt',
                }),
                'ignore.llm': mockFs.file({
                    mtime: new Date(2023, 4, 28),
                    content: '*.md',
                })
            },
        });
        const patterns = getIgnorePatterns('/test/dir');
        expect(patterns).toContain('*.md');
        expect(patterns).not.toContain('*.txt');
    });

    it('should merge .gitignore and defaults if ignore.llm is older or absent', () => {
        // Set the modification time of 'ignore.llm' to be older
        mockFs({
            '/test/dir': {
                '.gitignore': mockFs.file({
                    mtime: new Date(2023, 4, 27),
                    content: '*.txt\n*.log',
                }),
                'ignore.llm': mockFs.file({
                    mtime: new Date(2023, 4, 26),
                    content: '*.md',
                })
            },
        });

        const patterns = getIgnorePatterns('/test/dir');
        expect(patterns).toContain('*.txt');
        expect(patterns).toContain('*.log');
        expect(patterns).toContain('*.md');  // From the default patterns
    });

    it('should create ignore.llm with merged patterns if it doesn\'t exist', () => {
        mockFs({
            '/test/dir': {
                '.gitignore': '*.txt\n*.log'
            }
        });

        const patterns = getIgnorePatterns('/test/dir');
        expect(patterns).toContain('*.txt');
        expect(patterns).toContain('*.log');

        // Check if ignore.llm was created and has the merged content
        const ignoreLLMContent = fs.readFileSync('/test/dir/ignore.llm', 'utf-8');
        expect(ignoreLLMContent).toContain('*.txt');
        expect(ignoreLLMContent).toContain('*.log');
    });

    it('should handle empty .gitignore gracefully', () => {
        mockFs({
            '/test/dir': {
                '.gitignore': '',
                'ignore.llm': mockFs.file({
                    content: '*.llm'
                })
            }
        });

        const patterns = getIgnorePatterns('/test/dir');
        // Should only contain the default patterns 
        expect(patterns).toContain('*.llm');
        expect(patterns).not.toContain('*.txt');
    });

    it('should handle missing .gitignore gracefully', () => {
        mockFs({ '/test/dir': {} }); // No .gitignore

        const patterns = getIgnorePatterns('/test/dir');
        // Should only contain the default patterns
        expect(patterns).toContain('*.llm');
        expect(patterns).not.toContain('*.txt');
    });

    it('should return all default ignore patterns when no gitignore or ignore.llm files exist', () => {
        mockFs({
            '/test/dir': {} // Empty directory
        });

        const patterns = getIgnorePatterns('/test/dir');
        expect(patterns).toContain('*.llm');
        expect(patterns).toContain('.git');
        expect(patterns).toContain('.vscode');
        expect(patterns).toContain('node_modules');

        // expect /test/dir/ignore.llm to not exist
        expect(fs.existsSync('/test/dir/ignore.llm')).toBe(false);
    });
});

describe('isIgnored', () => {
    afterEach(() => {
        // Restore the original file system after each test
        mockFs.restore();
    });

    it('should ignore binary files', () => {
      // Mock a binary file
      mockFs({ '/test/dir/image.jpg': Buffer.from('binary data') });
      expect(isIgnored('/test/dir/image.jpg')).toBe(true);
      expect(isIgnored('/test/dir/file.doc')).toBe(true);
    });
  
    it('should ignore files based on .gitignore or ignore.llm patterns from any of the ancestor directories', () => {
      mockFs({
        '/ignore.llm': '*.mx',
        '/test/.gitignore': '*.txt',
        '/test/dir/ignore.llm': '*.md',
        '/test/dir/file.txt': 'Some text',
        '/test/dir/file.md': '# Markdown',
        '/test/dir/file.mx': 'Some text',
        '/test/dir/file.ts': 'console.log("Hello, TypeScript!");'
      });
  
      expect(isIgnored('/test/dir/file.txt')).toBe(true);
      expect(isIgnored('/test/dir/file.md')).toBe(true);
      expect(isIgnored('/test/dir/file.mx')).toBe(true);
      expect(isIgnored('/test/dir/file.ts')).toBe(false);
    });

    it('should ignore files matching default patterns even without ignore.llm', () => {
    // const DEFAULT_IGNORE = [
    //     '*.llm', // Always add these patterns
    //     '.git',
    //     '.vscode',
    //     'node_modules',
    //     'yarn.lock',
    //     'package-lock.json',
    //     '*.log'
    //     ]
      mockFs({
        '/test/dir': {
          'node_modules/some_module/file.js': 'Some JavaScript',
          '.git/config': 'git configuration',
          'ignore.llm': '*.txt',
          // .vscode directory and its files
          '.vscode': {
            'settings.json': 'settings',
            'extensions.json': 'extensions',
          },
          'yarn.lock': 'yarn lock',
          'package-lock.json': 'package lock',
          'file.log': 'log message'
        },
      }); 
      expect(isIgnored('/test/dir/node_modules/some_module/file.js')).toBe(true);
      expect(isIgnored('/test/dir/.git/config')).toBe(true);
      expect(isIgnored('/test/dir/ignore.llm')).toBe(true);
      expect(isIgnored('/test/dir/.vscode/settings.json')).toBe(true);
      expect(isIgnored('/test/dir/.vscode/extensions.json')).toBe(true);
      expect(isIgnored('/test/dir/yarn.lock')).toBe(true);
      expect(isIgnored('/test/dir/package-lock.json')).toBe(true);
      expect(isIgnored('/test/dir/file.log')).toBe(true);
    });

        

        it('should ignore based on pattern - *', () => {
            const ignorePatterns = {
                '*' : {
                    files: {
                        '/test/dir/node_modules/some_module/file.js': true,
                        '/test/dir/.git/config': true,
                        '/test/dir/ignore.llm': true,
                        '/test/dir/settings.json': true,
                        '/test/settings.txt': true,
                        '/test/dir/node_modules_dir/some_module/file.js': true,
                        '/test/dir/some/path/node_modules_dir/file.js': true,
                        '/test/dir/file.js': true,
                        '/test/dir/file.test.js': true,
                        '/test/dir/src/utils.ts': true,
                        '/test/dir/src/utils.test.ts': true,
                        '/tmp/file.txt': true,
                        '/tmp/file.md': true,
                        '/home/user/Downloads/file.txt': true,
                        '/home/user/Downloads/file.md': true,
                        '/test/dir/tests/file.test.js': true,
                        '/test/dir/test.js': true,
                        '/test/dir/test.test.js': true,
                        '/test/node_modules_dir/file.js': true,
                        '/test/dir/some/path/some_module/node_modules_dir/another_module/file.js': true,
                        '/test/dir/src/tests/file.test.js': true,
                    }
                },
                '*.txt': {
                    files: {
                        '/test/dir/settings.json': false,
                        '/test/settings.txt': true
                    }
                },
                'node_modules_dir': {
                    files: {
                        '/test/dir/node_modules_dir/some_module/file.js': true,
                        '/test/dir/some/path/node_modules_dir/file.js': true,
                    }
                },
                '!*.test.js': {
                    files: {
                        '/test/dir/file.js': true,
                        '/test/dir/file.test.js': false
                    }
                },
                '!src/utils.ts': {
                    files: {
                        '/test/dir/src/utils.ts': false,
                        '/test/dir/src/utils.test.ts': true
                    }
                },
                '/tmp/*': {
                    files: {
                        '/test/dir/file.js': true,
                        '/tmp/file.txt': true,
                        '/tmp/file.md': true
                    }
                },
                '/home/user/Downloads': {
                    files: {
                        '/home/user/Downloads/file.txt': true,
                        '/home/user/Downloads/file.md': true
                    }
                },
                '**/tests': {
                    files: {
                        '/test/dir/file.js': true,
                        '/test/dir/tests/file.test.js': true
                    }
                },
                '**/test*.js': {
                    files: {
                        '/test/dir/file.js': true,
                        '/test/dir/test.js': true,
                        '/test/dir/test.test.js': true
                    }
                },
                '**/node_modules_dir/**': {
                    files: {
                        '/test/node_modules_dir/file.js': true,
                        '/test/dir/node_modules_dir/some_module/file.js': true,
                        '/test/dir/some/path/some_module/node_modules_dir/another_module/file.js': true
                    }
                },
                'src/tests/*.js': {
                    files: {
                        '/test/dir/src/tests/file.test.js': true,
                        '/test/dir/src/utils.test.ts': true
                    }
                },
            };
            Object.entries(ignorePatterns).forEach(([pattern, ignorePattern]) => {
                mockFs({
                    ...Object.entries(ignorePattern.files)
                        .reduce((acc, [file, _]) => {
                            acc[file] = `Dummy content`;
                            return acc;
                        }, {}),
                        '.gitignore': pattern
                });
                Object.entries(ignorePattern.files).forEach(([file, expected]) => {
                    expect(file + ' ' + isIgnored(file)).toBe(file + ' ' + expected);
                });
                // Restore the mock after each pattern
                mockFs.restore();
            });
        });
  });