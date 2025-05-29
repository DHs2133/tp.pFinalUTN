
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')                      // Separa acentos de letras
    .replace(/[\u0300-\u036f]/g, '')       // Elimina tildes
    .toLowerCase()
    .trim()                                // Quita espacios al principio/final
    .replace(/\s+/g, ' ');                 // Reduce espacios internos
}
