import ReactMarkdown from 'react-markdown';
import {
  AnchorHTMLAttributes,
  DetailedHTMLProps,
  ReactElement,
  useMemo,
} from 'react';
import { ReactMarkdownProps } from 'react-markdown/lib/complex-types';
import { CodeProps } from 'react-markdown/lib/ast-to-react';

import QuotedCode from '../components/QuotedCode';
import GeneratedCode from '../components/GeneratedCode';
import FileChip from '../components/FileChip';

type Props = {
  repoName: string;
  markdown: string;
  source: string;
};

// type:Quoted,lang:Rust,path:src/main.rs,lines:10-12

const MarkdownWithCode = ({markdown, repoName, source}: Props) => {
  const components = useMemo(() => {
    return {
      a(
        props: Omit<
          DetailedHTMLProps<
            AnchorHTMLAttributes<HTMLAnchorElement>,
            HTMLAnchorElement
          >,
          'ref'
        > &
          ReactMarkdownProps,
      ) {
        const [filePath, lines] = props.href?.split('#') || [];
        const [start, end] =
          lines?.split('-').map((l) => Number(l.slice(1))) || [];

        let fileName: string = '';
        if (props.children?.[0]) {
          if (typeof props.children[0] === 'string') {
            fileName = props.children?.[0];
          }
          const child = props.children[0] as ReactElement;
          if (child?.props && typeof child.props.children?.[0] === 'string') {
            fileName = child.props.children?.[0];
          }
        }

        // start ? `${start - 1}_${(end ?? start) - 1}` : undefined,

        return (
          <FileChip
            fileName={fileName || filePath || ''}
            skipIcon={!!fileName && fileName !== filePath}
            onClick={() => {}}
          />
        );
      },
      code({ node, inline, className, children, ...props }: CodeProps) {
        const matchLang = /lang:(\w+)/.exec(className || '') || /language-(\w+)/.exec(className || '');
        const matchType = /language-type:(\w+)/.exec(className || '');
        const matchPath = /path:(.+),/.exec(className || '');
        const matchLines = /lines:(.+)/.exec(className || '');
      
        const code = typeof children[0] === "string" ? children[0].replace(/\n$/, "") : "";
        const lines = matchLines?.[1].split("-").map((l) => Number(l)) || [];
        // colorPreview?
      
        return (matchType?.[1] || matchLang?.[1]) && typeof children[0] === "string" ? (
          matchType?.[1] === "Quoted" ? (
            <QuotedCode
              code={code}
              language={matchLang?.[1] || ""}
              filePath={matchPath?.[1] || ""}
              startLine={lines[0] ? lines[0] - 1 : null}
              repoName={repoName}
              repoSource={source}
            />
          ) : (
            <GeneratedCode code={code} language={matchLang?.[1] || ""} />
          )) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
      }
    }
  }, [repoName, source]);

  return (<ReactMarkdown components={components}>{markdown}</ReactMarkdown>);
}

export default MarkdownWithCode;