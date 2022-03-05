import { Typography } from 'antd';

const { Title } = Typography;


/**
 * Компонент таблицы с логами серверных ошибок.
 */
const ServerErrorsLogsTable = () => {

  return (
    <>
      <Title level={2} className="center top-margin-05">Логи серверных ошибок</Title>
    </>
  );
};


export default ServerErrorsLogsTable;
