// Marketing pages open their in-content links in a new tab so visitors keep
// the landing page. In-page anchors (#…) stay in the current tab.
document.querySelectorAll<HTMLAnchorElement>('main a[href]').forEach((link) => {
	const href = link.getAttribute('href') ?? '';
	if (href.startsWith('#')) return;
	link.target = '_blank';
	const rel = new Set(link.rel.split(' ').filter(Boolean));
	rel.add('noopener');
	link.rel = [...rel].join(' ');
});
