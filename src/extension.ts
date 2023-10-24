import * as vsc from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function fileToItemKind(file: fs.Dirent): vsc.CompletionItemKind {
	if (file.isFile()) {
		return vsc.CompletionItemKind.File;
	}
	return vsc.CompletionItemKind.Folder;
}

// (prefix)(varname|dots|root)(path)
export type ParsedPath = {
	prefix: string;
	varname?: string;
	dots?: string;
	root?: string;
	path: string;
};

export function parseString(input: string): ParsedPath | null {
	const inputRegExp = Object.freeze(RegExp("(?<prefix>^.*('|\"|=)|^)((\\${(?<varname>.+)}\/)|(?<dots>\.{1,2}\/)|(?<root>\/))(?<path>(.+\/)+)*$"));
	const groups = inputRegExp.exec(input)?.groups;

	if (!groups) {
		return null;
	}

	return {
		prefix: groups.prefix,
		varname: groups.varname ?? null,
		dots: groups.dots ?? null,
		root: groups.root ?? null,
		path: groups.path ?? '',
	};
}

export type PossiblePath = {
	variable: string;
	path: string;
};

const rootPath: PossiblePath = Object.freeze({ variable: '/', path: '/' });

export type PossiblePaths = {
	userDefined: PossiblePath[],
	useRoot: boolean,
	other: PossiblePath[]
};

function gatherRoots(document: vsc.TextDocument): PossiblePaths {
	// TODO: check if user/workspace vars will be merged
	const conf = vsc.workspace.getConfiguration('pathcompleter');

	let otherPaths: PossiblePath[] = [];
	if (conf.get('useWorkspace') ?? true) {
		(vsc.workspace.workspaceFolders ?? [])
			.map((wf) => (wf.uri.fsPath))
			.forEach((p) => { otherPaths.push({ variable: 'w', path: p }); });
	}
	if (conf.get('useCurrentFileDir')) {
		otherPaths.push({ variable: 'f', path: path.dirname(document.fileName) });
	}

	// TODO: filter userDefined with regexps for the content inside and show errors
	const userDefined = conf.get('customPaths') as PossiblePath[] ?? [];
	for (let root of userDefined) {
		if (!root.path.endsWith('/')) {
			root.path += '/';
		}
	}

	return {
		userDefined: userDefined,
		useRoot: conf.get('useRoot') ?? true,
		other: otherPaths
	};
}

export type EnteredPath = {
	root: PossiblePath;
	folder: string;
};

// TODO: cover with tests
export function makePossiblePaths(paths: PossiblePaths, str: string): EnteredPath[] {
	const parsed = parseString(str);
	if (parsed?.root && paths.useRoot) {
		return [{ root: rootPath, folder: parsed.path }];
	} else if (parsed?.dots) {
		return paths.other.map((p) => {
			return {
				root: {
					variable: p.variable,
					path: p.path + '/' + parsed.dots
				},
				folder: parsed.path
			};
		});
	} else if (parsed?.varname) {
		for (const p of paths.userDefined) {
			if (p.variable === parsed.varname) {
				return [{ root: p, folder: parsed.path }];
			}
		}
	}
	return [];
}

export function activate(context: vsc.ExtensionContext) {
	const pathProvider = vsc.languages.registerCompletionItemProvider(
		'*',
		{
			provideCompletionItems(document, position, _token, _context) {
				const linePrefix = document.lineAt(position).text.substring(0, position.character);
				const roots = gatherRoots(document);
				const paths = makePossiblePaths(roots, linePrefix);

				return paths.flatMap((ep) => {
					const fullPath = ep.root.path + '/' + ep.folder;
					if (!fs.existsSync(fullPath)) {
						return [];
					}
					return fs.readdirSync(fullPath, { withFileTypes: true })
						.filter((f) => f.isFile || f.isDirectory)
						.map((f) => {
							const ci = new vsc.CompletionItem(`[${ep.root.variable}] ${f.name}`, fileToItemKind(f));
							ci.insertText = f.name;
							return ci;
						});
				});
			},
		},
		'/'
	);
	context.subscriptions.push(pathProvider);
}

export function deactivate() { }
