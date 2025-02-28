const Row = ({ children, gap }: { children: React.ReactNode, gap?: number }) => {
  return <div className="row" style={{ gap: gap ? gap * 8 : 0 }}>
    {children}
  </div>
}

export default Row;
