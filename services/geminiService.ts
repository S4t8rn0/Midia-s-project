// Funções simuladas sem necessidade de API do Google
export const generateContentSuggestion = async (prompt: string): Promise<string> => {
  // Retorna sugestões padrão sem usar IA
  await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay de API
  
  const suggestions = [
    "📸 Lembre-se de capturar os momentos especiais do evento! Fotos de bastidores também são importantes.",
    "🎥 Verifique o enquadramento e iluminação antes de começar a gravação. Teste o áudio com antecedência.",
    "✨ Considere diferentes ângulos de câmera para tornar o conteúdo mais dinâmico e interessante.",
    "📱 Não esqueça de fazer stories e posts em tempo real para engajar a comunidade online.",
    "🎨 Prepare materiais gráficos com antecedência para uma comunicação visual consistente."
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};

export const generateTaskIdeas = async (topic: string): Promise<string[]> => {
  // Retorna ideias padrão de tarefas sem usar IA
  await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay de API
  
  const defaultTasks = [
    `Planejar conteúdo para ${topic}`,
    `Criar material gráfico relacionado a ${topic}`,
    `Revisar e aprovar postagens sobre ${topic}`
  ];
  
  return defaultTasks;
}
