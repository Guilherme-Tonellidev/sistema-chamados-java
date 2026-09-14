import './StatusChamado.css'

const classesStatus = {
  Aberto: 'aberto',
  'Em atendimento': 'atendimento',
  Resolvido: 'resolvido',
}

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export default function StatusChamado({ chamado }) {
  let valorData = null
  let descricaoData = ''

  if (chamado.status === 'Em atendimento') {
    valorData = chamado.dataInicioAtendimento
    descricaoData = 'Início do atendimento'
  } else if (chamado.status === 'Resolvido') {
    valorData = chamado.dataResolucao
    descricaoData = 'Resolução'
  }

  const data = valorData ? new Date(valorData) : null
  const dataValida = data !== null && !Number.isNaN(data.getTime())

  return (
    <div className="status-com-data">
      <span className={`status ${classesStatus[chamado.status] || ''}`}>
        {chamado.status}
      </span>

      {descricaoData && (
        dataValida ? (
          <time
            className="data-status"
            dateTime={data.toISOString()}
            title={descricaoData}
          >
            {formatadorData.format(data)}
          </time>
        ) : (
          <span className="data-status">
            {valorData ? 'Data indisponível' : 'Data não registrada'}
          </span>
        )
      )}
    </div>
  )
}