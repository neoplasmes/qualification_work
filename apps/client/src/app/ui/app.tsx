export const App = () => {
    fetch('/api/dbcheck')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            return res.json();
        })
        .catch(e => console.error(e));

    return <div>hello</div>;
};
