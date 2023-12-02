
interface CustomAlertProperties{
  title: string,
  children?: string | React.ReactNode,
  onClose?: (() => any),
}

export default function CustomAlert(props: CustomAlertProperties){
  return (
    <div style={{
      position: "fixed",
      width: "100%",
      height: "100%",
      display: "flex",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: "400px",
        width: "100%",
        backgroundColor: "#fff",
        minHeight: "250px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        boxSizing: "border-box",
        padding: "20px 25px",
        color: "black",
      }}>
        <div style={{
          display: "flex",
          marginBottom: "10px",
          justifyContent: "space-between"
        }}>
          <h3 style={{color: "black"}}>{props.title}</h3>
          <h3
            style={{color: "black", cursor: "pointer"}}
            onClick={() => {
              if(props.onClose){
                props.onClose();
              }
            }}
          >X</h3>
        </div>
        {props.children}
      </div>
    </div>
  );
}